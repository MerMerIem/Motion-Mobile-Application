import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// null = that target is disabled / not set
export const GoalSchema = z.object({
  targetSessions: z.number().nullable(),
  targetMinutes: z.number().nullable(),
  targetDistanceMeters: z.number().nullable(),
  updatedAt: z.string().nullable(), // null = the user never set a goal
});

export class GoalDto extends createZodDto(GoalSchema) {}
export type GoalResponse = z.infer<typeof GoalSchema>;