import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActivitySource, ActivityType } from '../../generated/prisma/enums.js';
import {
  MAX_ROUTE_POINTS,
  RoutePointSchema,
  activityEnums,
  activityFields,
} from './activity-fields.js';

// One endpoint for both kinds of activity:
//  - source "gps":    route is REQUIRED (walking / running / cycling only)
//  - source "manual": route is NOT allowed (e.g. a swim typed in by hand)
export const CreateActivitySchema = z
  .object({
    type: activityEnums.type,
    source: activityEnums.source,
    startedAt: activityFields.startedAt,
    durationSeconds: activityFields.durationSeconds,
    distanceMeters: activityFields.distanceMeters.optional(),
    elevationGainMeters: activityFields.elevationGainMeters.optional(),
    effort: activityFields.effort.optional(),
    note: activityFields.note.optional(),
    recommendationId: z.uuid().nullable().optional(),
    route: z.array(RoutePointSchema).min(2).max(MAX_ROUTE_POINTS).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.source === ActivitySource.Gps) {
      if (v.type === ActivityType.Swimming) {
        ctx.addIssue({
          code: 'custom',
          path: ['type'],
          message: 'Swimming cannot be recorded with GPS; use source "Manual"',
        });
      }
      if (!v.route) {
        ctx.addIssue({
          code: 'custom',
          path: ['route'],
          message: 'route is required for GPS activities',
        });
      }
    } else if (v.route) {
      ctx.addIssue({
        code: 'custom',
        path: ['route'],
        message: 'route is only allowed for GPS activities',
      });
    }
  });

export class CreateActivityDto extends createZodDto(CreateActivitySchema) {}
