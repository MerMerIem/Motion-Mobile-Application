import { z } from 'zod';
import { FeedbackType } from '../../generated/prisma/enums.js';

export const FeedbackSchema = z.object({
  type: z.enum(FeedbackType),
});
export type FeedbackDto = z.infer<typeof FeedbackSchema>;