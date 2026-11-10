import { z } from 'zod';
import { RecommendationType } from '../../generated/prisma/enums.js';

export const LlmOutputSchema = z.object({
  type: z.enum(RecommendationType),
  durationMinutes: z.int().min(5).max(240).nullable(),
  distanceMeters: z.int().min(100).max(200_000).nullable(),
  explanation: z.string().trim().min(10).max(300),
});
export type LlmOutput = z.infer<typeof LlmOutputSchema>;