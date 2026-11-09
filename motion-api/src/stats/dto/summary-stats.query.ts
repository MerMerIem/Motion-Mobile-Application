import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivityType } from '../../generated/prisma/enums.js';

// Same filters as GET /activities, so "the list" and "its summary" always
// agree. Without from/to the summary covers all time.
export const SummaryStatsQuerySchema = z
  .object({
    type: z.enum(ActivityType).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((q) => !q.from || !q.to || new Date(q.from) <= new Date(q.to), {
    message: '"from" must not be after "to"',
    path: ['from'],
  });

export class SummaryStatsQueryDto extends createZodDto(SummaryStatsQuerySchema) {}