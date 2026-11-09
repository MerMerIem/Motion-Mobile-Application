import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoalService } from '../goal/goal.service.js';
import { ProfileService } from '../profile/profile.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  StatsByType,
  StatsTotals,
  SummaryStatsResponse,
  WeeklyStatsResponse,
} from './dto/stats.dto.js';
import type { SummaryStatsQueryDto } from './dto/summary-stats.query.js';
import type { WeeklyStatsQueryDto } from './dto/weekly-stats.query.js';
import { localDate, weekDays, weekRange } from './week-range.js';

// Weeks start on Sunday (0 = Sunday, 1 = Monday)
const WEEK_STARTS_ON = 0;

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    private goals: GoalService,
    private profile: ProfileService,
  ) {}

  // Home: this week's numbers + progress against the weekly goals
  async weekly(
    userId: string,
    q: WeeklyStatsQueryDto,
  ): Promise<WeeklyStatsResponse> {
    const profile = await this.profile.get(userId);

    const timezone = this.safeTimezone(profile.timezone);
    const { start, end } = weekRange(new Date(), timezone, {
      weeksAgo: q.weeksAgo,
      weekStartsOn: WEEK_STARTS_ON,
    });

    // Each week is compared with the goal that applied to THAT week: the
    // newest goal version created before the week ended (so a goal changed
    // during the week counts for that whole week).
    const [{ totals, byType }, goal, rows] = await Promise.all([
      this.aggregate({ userId, startedAt: { gte: start, lt: end } }),
      this.goals.getInEffect(userId, end),
      // the week's activities, for the per-day "rhythm" (small: one week)
      this.prisma.activity.findMany({
        where: { userId, startedAt: { gte: start, lt: end } },
        select: {
          id: true,
          type: true,
          startedAt: true,
          durationSeconds: true,
          distanceMeters: true,
          effort: true,
        },
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      }),
    ]);

    // 7 empty days, then drop each activity into the day it happened on
    // IN THE USER'S TIMEZONE (Sat 23:30 UTC is already Sunday in Algiers)
    const days: WeeklyStatsResponse['days'] = weekDays(start, timezone).map(
      (date) => ({ date, sessions: 0, durationSeconds: 0, activities: [] }),
    );
    const dayByDate = new Map(days.map((d) => [d.date, d]));
    for (const r of rows) {
      const day = dayByDate.get(localDate(r.startedAt, timezone));
      if (!day) continue;
      day.sessions += 1;
      day.durationSeconds += r.durationSeconds;
      day.activities.push({
        id: r.id,
        type: r.type,
        startedAt: r.startedAt.toISOString(),
        durationSeconds: r.durationSeconds,
        distanceMeters: r.distanceMeters,
        effort: r.effort,
      });
    }

    return {
      week: {
        start: start.toISOString(),
        end: end.toISOString(),
        timezone: profile.timezone,
      },
      totals,
      byType,
      days,
      goals: {
        sessions: { current: totals.sessions, target: goal.targetSessions },
        // floor: 119 min 59 s does not reach a 120 min goal
        minutes: {
          current: Math.floor(totals.durationSeconds / 60),
          target: goal.targetMinutes,
        },
        distanceMeters: {
          current: totals.distanceMeters ?? 0,
          target: goal.targetDistanceMeters,
        },
      },
    };
  }

  // History: summary of any period (and optionally one sport)
  async summary(
    userId: string,
    q: SummaryStatsQueryDto,
  ): Promise<SummaryStatsResponse> {
    const where: Prisma.ActivityWhereInput = {
      userId,
      ...(q.type && { type: q.type }),
      ...((q.from || q.to) && {
        startedAt: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
    };
    const { totals, byType } = await this.aggregate(where);
    return {
      from: q.from ?? null,
      to: q.to ?? null,
      type: q.type ?? null,
      totals,
      byType,
    };
  }

  // One GROUP BY query gives the per-sport numbers; the totals are summed from them.
  private async aggregate(
    where: Prisma.ActivityWhereInput,
  ): Promise<{ totals: StatsTotals; byType: StatsByType[] }> {
    const rows = await this.prisma.activity.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
      _sum: { durationSeconds: true, distanceMeters: true },
    });

    const byType: StatsByType[] = rows
      .map((r) => ({
        type: r.type,
        sessions: r._count._all,
        durationSeconds: r._sum.durationSeconds ?? 0,
        distanceMeters: r._sum.distanceMeters, // null = no known distance
      }))
      .sort((a, b) => b.sessions - a.sessions || a.type.localeCompare(b.type));

    const knownDistances = byType
      .map((r) => r.distanceMeters)
      .filter((d): d is number => d !== null);

    return {
      byType,
      totals: {
        sessions: byType.reduce((n, r) => n + r.sessions, 0),
        durationSeconds: byType.reduce((n, r) => n + r.durationSeconds, 0),
        distanceMeters:
          knownDistances.length > 0
            ? knownDistances.reduce((n, d) => n + d, 0)
            : null,
      },
    };
  }

  // A broken timezone must not take the whole Home screen down
  private safeTimezone(tz: string): string {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return tz;
    } catch {
      return 'UTC';
    }
  }
}