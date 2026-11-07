import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivitySource, ActivityType, EffortLevel } from '../../generated/prisma/enums.js';
import { RoutePointSchema } from './activity-fields.js';

const base = {
  id: z.string(),
  type: z.enum(ActivityType),
  source: z.enum(ActivitySource),
  startedAt: z.string(),
  durationSeconds: z.number(),
  distanceMeters: z.number().nullable(), // null = unknown, NOT zero
  elevationGainMeters: z.number().nullable(),
  effort: z.enum(EffortLevel).nullable(),
};

// History list: light, no route points (just a flag for the map icon).
export const ActivityListItemSchema = z.object({
  ...base,
  hasRoute: z.boolean(),
});

// Session detail: everything, including the route for GPS activities.
export const ActivityDetailSchema = z.object({
  ...base,
  note: z.string().nullable(),
  recommendationId: z.string().nullable(),
  route: z.array(RoutePointSchema).nullable(), // null for manual activities
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ActivityListSchema = z.object({
  items: z.array(ActivityListItemSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export class ActivityListItemDto extends createZodDto(ActivityListItemSchema) {}
export class ActivityDetailDto extends createZodDto(ActivityDetailSchema) {}
export class ActivityListDto extends createZodDto(ActivityListSchema) {}

export type ActivityListItemResponse = z.infer<typeof ActivityListItemSchema>;
export type ActivityDetailResponse = z.infer<typeof ActivityDetailSchema>;
export type ActivityListResponse = z.infer<typeof ActivityListSchema>;