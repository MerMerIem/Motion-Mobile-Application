import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { GoalService } from '../goal/goal.service.js';
import { StatsService } from '../stats/stats.service.js';
import { LlmOutputSchema } from './llm/llm-output.schema.js';
import { SYSTEM_PROMPT } from './llm/prompt.js';
import { applyGuardrails, fallbackRecommendation } from './guardrails.js';
import {
  RecommendationStatus,
  FeedbackType,
} from '../generated/prisma/enums.js';
import { GENERATE_JOB, RECOMMENDATION_QUEUE } from './recommendation.queue.js';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { LLM_PROVIDERS, LlmProvider } from './llm/llm-provider.js';

const DAY = 86_400_000;

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private prisma: PrismaService,
    private profiles: ProfileService,
    private goals: GoalService,
    private stats: StatsService,
    @Inject(LLM_PROVIDERS) private providers: LlmProvider[],
    @InjectQueue(RECOMMENDATION_QUEUE) private queue: Queue,
  ) {}

  async getNext(userId: string) {
    const { context } = await this.buildContext(userId);
    if (!context)
      return { status: 'setup_required' as const, missing: 'profile setup' };

    const hash = createHash('sha256')
      .update(JSON.stringify(context))
      .digest('hex');

    // 1. a saved recommendation matches the current data -> return it
    const open = await this.prisma.recommendation.findFirst({
      where: {
        userId,
        status: {
          in: [RecommendationStatus.Suggested, RecommendationStatus.Planned],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (open && (open.inputSnapshot as any)?.hash === hash) {
      return { status: 'ready' as const, recommendation: open };
    }

    // 2. otherwise ask the worker to generate one, and answer immediately
    await this.queue.add(
      GENERATE_JOB,
      { userId },
      {
        jobId: `${userId}-${hash}`,
        attempts: 4,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    return { status: 'pending' as const };
  }

  // the real work: reuse the saved recommendation or generate a new one
  async runGeneration(userId: string, attemptsMade = 0, isLastAttempt = true) {
    const { context, guard } = await this.buildContext(userId);
    if (!context) return null;

    const hash = createHash('sha256')
      .update(JSON.stringify(context))
      .digest('hex');

    const open = await this.prisma.recommendation.findFirst({
      where: {
        userId,
        status: {
          in: [RecommendationStatus.Suggested, RecommendationStatus.Planned],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (open && (open.inputSnapshot as any)?.hash === hash) return open;

    if (open?.status === RecommendationStatus.Suggested) {
      await this.prisma.recommendation.update({
        where: { id: open.id },
        data: { status: RecommendationStatus.Dismissed },
      });
    }

    const { output, source } = await this.generate(
      context,
      guard,
      attemptsMade,
      isLastAttempt,
    );
    return this.prisma.recommendation.create({
      data: {
        userId,
        type: output.type,
        durationMinutes: output.durationMinutes,
        distanceMeters: output.distanceMeters,
        explanation: output.explanation,
        source,
        inputSnapshot: { hash, context },
      },
    });
  }

  private static readonly ATTEMPTS_PER_PROVIDER = 2;

  private async generate(
    context: object,
    guard: any,
    attemptsMade: number,
    isLastAttempt: boolean,
  ) {
    const index = Math.min(
      Math.floor(attemptsMade / RecommendationService.ATTEMPTS_PER_PROVIDER),
      this.providers.length - 1,
    );
    const provider = this.providers[index];
    try {
      this.logger.log(`Attempt ${attemptsMade + 1}: using ${provider.name}`);
      const raw = await provider.complete(
        SYSTEM_PROMPT,
        JSON.stringify(context),
      );
      const parsed = LlmOutputSchema.parse(JSON.parse(raw));
      const safe = applyGuardrails(parsed, guard);
      if (!safe) throw new Error('Rejected by guardrails');
      return { output: safe, source: `${provider.name}:${provider.model}` };
    } catch (e) {
      this.logger.warn(`${provider.name} failed: ${(e as Error).message}`);
      if (!isLastAttempt) throw e; // BullMQ retries
    }
    return { output: fallbackRecommendation(guard), source: 'fallback' };
  }

  async accept(userId: string, id: string) {
    return this.setStatus(userId, id, RecommendationStatus.Planned);
  }
  async dismiss(userId: string, id: string) {
    return this.setStatus(userId, id, RecommendationStatus.Dismissed);
  }

  async feedback(userId: string, id: string, type: FeedbackType) {
    await this.assertOwned(userId, id);
    return this.prisma.recommendationFeedback.upsert({
      where: { recommendationId: id },
      create: { recommendationId: id, type },
      update: { type },
    });
  }

  private async setStatus(
    userId: string,
    id: string,
    status: RecommendationStatus,
  ) {
    await this.assertOwned(userId, id);
    return this.prisma.recommendation.update({
      where: { id },
      data: { status },
    });
  }

  private async assertOwned(userId: string, id: string) {
    const r = await this.prisma.recommendation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!r) throw new NotFoundException('Recommendation not found');
  }

  private async buildContext(userId: string) {
    const profile = await this.profiles.get(userId);
    if (!profile.setupCompleted) return { context: null, guard: null };

    const now = Date.now();
    const [goal, week, activities, feedback] = await Promise.all([
      this.goals.get(userId),
      this.stats.weekly(userId, { weeksAgo: 0 }),
      this.prisma.activity.findMany({
        where: { userId, startedAt: { gte: new Date(now - 28 * DAY) } },
        orderBy: { startedAt: 'desc' },
        take: 30,
        select: {
          type: true,
          startedAt: true,
          durationSeconds: true,
          distanceMeters: true,
          effort: true,
        },
      }),
      this.prisma.recommendationFeedback.findMany({
        where: {
          recommendation: { userId },
          createdAt: { gte: new Date(now - 14 * DAY) },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { type: true, recommendation: { select: { type: true } } },
      }),
    ]);

    const recent = activities.map((a) => ({
      type: a.type,
      daysAgo: Math.floor((now - a.startedAt.getTime()) / DAY),
      minutes: Math.round(a.durationSeconds / 60),
      distanceMeters: a.distanceMeters,
      effort: a.effort,
    }));

    const context = {
      today: new Date().toISOString().slice(0, 10),
      profile: {
        mainGoal: profile.mainGoal,
        experienceLevel: profile.experienceLevel,
        preferredActivities: profile.preferredActivities,
        daysPerWeek: profile.daysPerWeek,
        minutesPerSession: profile.minutesPerSession,
        preferredDays: profile.preferredDays,
      },
      weeklyGoal: goal,
      thisWeek: {
        sessions: week.totals.sessions,
        minutes: Math.floor(week.totals.durationSeconds / 60),
      },
      recentActivities: recent,
      recentFeedback: feedback.map((f) => ({
        about: f.recommendation.type,
        feedback: f.type,
      })),
    };

    const last = activities[0];
    const guard = {
      preferredActivities: profile.preferredActivities as string[],
      minutesPerSession: profile.minutesPerSession!,
      lastSession: last
        ? {
            effort: last.effort as string | null,
            hoursAgo: (now - last.startedAt.getTime()) / 3_600_000,
          }
        : null,
      recentNotSuitableTypes: feedback
        .filter((f) => f.type === FeedbackType.NotSuitable)
        .map((f) => f.recommendation.type as string),
    };
    return { context, guard };
  }
}
