import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FeedbackType } from '../../generated/prisma/enums.js';

export const FeedbackSchema = z.object({
  type: z.enum(FeedbackType),
});

export class FeedbackDto extends createZodDto(FeedbackSchema) {}