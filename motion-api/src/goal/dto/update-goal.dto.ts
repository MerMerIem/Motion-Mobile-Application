import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// PATCH semantics: field missing = untouched, null = target disabled.
// Ranges are conservative on purpose (spec: "realistic goals").
export const UpdateGoalSchema = z
  .object({
    targetSessions: z.int().min(1).max(14).nullable(),
    targetMinutes: z.int().min(10).max(3000).nullable(), // per week
    targetDistanceMeters: z.int().min(500).max(500_000).nullable(), // per week
  })
  .partial()
  .strict();

export class UpdateGoalDto extends createZodDto(UpdateGoalSchema) {}