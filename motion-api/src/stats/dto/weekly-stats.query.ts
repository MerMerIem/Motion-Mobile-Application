import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// weeksAgo: 0 = this week (default), 1 = last week, ... up to a year back.
// Lets the Goals page compare weeks. Each week is measured against the goal
// that applied to THAT week (goals are versioned); weeks before the user's
// first goal have target: null.
export const WeeklyStatsQuerySchema = z.object({
  weeksAgo: z.coerce.number().int().min(0).max(52).default(0),
});

export class WeeklyStatsQueryDto extends createZodDto(WeeklyStatsQuerySchema) {}