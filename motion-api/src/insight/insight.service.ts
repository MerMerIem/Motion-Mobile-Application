import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { StatsService } from '../stats/stats.service.js';

const DAY = 86_400_000;
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Injectable()
export class InsightFactsService {
  constructor(
    private prisma: PrismaService,
    private profiles: ProfileService,
    private stats: StatsService,
  ) {}

  async build(userId: string) {
    const profile = await this.profiles.get(userId);
    if (!profile.setupCompleted) return null;

    // this week, already computed in the user's timezone
    const week = await this.stats.weekly(userId, { weeksAgo: 0 });

    // last 4 weeks = the start of this week minus 3 weeks, until now
    const from = new Date(new Date(week.week.start).getTime() - 21 * DAY);
    const to = new Date();

    const [month, effortRows] = await Promise.all([
      this.stats.summary(userId, {
        from: from.toISOString(),
        to: to.toISOString(),
      }),
      this.prisma.activity.groupBy({
        by: ['effort'],
        where: { userId, startedAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
    ]);

    // days trained this week, and how many fall on the user's preferred days
    const trainedDates = week.days
      .filter((d) => d.sessions > 0)
      .map((d) => d.date);
    const preferred = new Set<string>(profile.preferredDays);
    const trainedOnPreferred = trainedDates.filter((date) =>
      preferred.has(WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]),
    ).length;

    const monthSessions = month.totals.sessions;
    return {
      today: new Date().toISOString().slice(0, 10),
      profile: {
        mainGoal: profile.mainGoal,
        experienceLevel: profile.experienceLevel,
        preferredActivities: profile.preferredActivities,
        daysPerWeek: profile.daysPerWeek,
        minutesPerSession: profile.minutesPerSession,
        preferredDays: profile.preferredDays,
      },
      thisWeek: {
        sessions: week.totals.sessions,
        minutes: Math.floor(week.totals.durationSeconds / 60),
        distanceMeters: week.totals.distanceMeters ?? 0,
        daysTrained: trainedDates.length,
        trainedOnPreferredDays: trainedOnPreferred,
        goals: week.goals,
      },
      last4Weeks: {
        sessions: monthSessions,
        minutes: Math.floor(month.totals.durationSeconds / 60),
        distanceMeters: month.totals.distanceMeters,
        bySport: month.byType.map((t) => ({
          type: t.type,
          sessions: t.sessions,
          minutes: Math.floor(t.durationSeconds / 60),
          sharePercent: monthSessions
            ? Math.round((t.sessions / monthSessions) * 100)
            : 0,
        })),
        effort: Object.fromEntries(
          effortRows
            .filter((r) => r.effort)
            .map((r) => [r.effort, r._count._all]),
        ),
      },
    };
  }
}
