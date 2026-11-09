import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivityType } from '../../generated/prisma/enums.js';

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

export const WeeklyStatsSchema = z.object({
  week: z.object({
    start: z.string(), // inclusive
    end: z.string(), // exclusive (start of next week)
    timezone: z.string(),
  }),
  totals: TotalsSchema,
  byType: z.array(ByTypeSchema),
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