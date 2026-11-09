import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivityType, EffortLevel } from '../../generated/prisma/enums.js';

// Same sums for every sport together (totals) and for each sport (byType).
// distanceMeters is null when NO session in the group has a known distance
// (missing is not zero). Unknown distances are skipped when adding.
const TotalsSchema = z.object({
  sessions: z.number(),
  durationSeconds: z.number(),
  distanceMeters: z.number().nullable(),
});

const ByTypeSchema = z.object({
  type: z.enum(ActivityType),
  sessions: z.number(),
  durationSeconds: z.number(),
  distanceMeters: z.number().nullable(),
});

// current is always a number (progress so far); target is null when that goal
// is disabled / never set. minutes: current is in MINUTES (like the target).
const GoalProgressSchema = z.object({
  current: z.number(),
  target: z.number().nullable(),
});

// One session of a day: enough to show the day's details without calling
// GET /activities/:id for each one (that one also has the route and the note).
const DayActivitySchema = z.object({
  id: z.string(),
  type: z.enum(ActivityType),
  startedAt: z.string(),
  durationSeconds: z.number(),
  distanceMeters: z.number().nullable(), // null = unknown, NOT zero
  effort: z.enum(EffortLevel).nullable(),
});

// One entry per day of the week (7 entries, in order) for the "weekly rhythm"
// strip: one item in `activities` = one dot (the app colors it by sport).
const DaySchema = z.object({
  date: z.string(), // local date in the user's timezone, "YYYY-MM-DD"
  sessions: z.number(),
  durationSeconds: z.number(),
  activities: z.array(DayActivitySchema), // oldest first
});

export const WeeklyStatsSchema = z.object({
  week: z.object({
    start: z.string(), // inclusive
    end: z.string(), // exclusive (start of next week)
    timezone: z.string(),
  }),
  totals: TotalsSchema,
  byType: z.array(ByTypeSchema),
  days: z.array(DaySchema),
  goals: z.object({
    sessions: GoalProgressSchema,
    minutes: GoalProgressSchema,
    distanceMeters: GoalProgressSchema,
  }),
});

export const SummaryStatsSchema = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
  type: z.enum(ActivityType).nullable(),
  totals: TotalsSchema,
  byType: z.array(ByTypeSchema),
});

export class WeeklyStatsDto extends createZodDto(WeeklyStatsSchema) {}
export class SummaryStatsDto extends createZodDto(SummaryStatsSchema) {}

export type WeeklyStatsResponse = z.infer<typeof WeeklyStatsSchema>;
export type SummaryStatsResponse = z.infer<typeof SummaryStatsSchema>;
export type StatsTotals = z.infer<typeof TotalsSchema>;
export type StatsByType = z.infer<typeof ByTypeSchema>;