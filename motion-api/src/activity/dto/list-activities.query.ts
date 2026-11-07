import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivityType } from '../../generated/prisma/enums.js';

// Query params arrive as strings, hence z.coerce.
// from / to are ISO instants: the app computes "this week" / "this month"
// in the user's timezone and sends the boundaries.
export const ListActivitiesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(ActivityType).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((q) => !q.from || !q.to || new Date(q.from) <= new Date(q.to), {
    message: '"from" must not be after "to"',
    path: ['from'],
  });

export class ListActivitiesQueryDto extends createZodDto(
  ListActivitiesQuerySchema,
) {}