import { z } from 'zod';
import {
  ActivitySource,
  ActivityType,
  EffortLevel,
} from '../../generated/prisma/enums.js';

// A GPS route is a list of points. 10k points = ~2.7h at 1 point/second.
// The app should downsample (e.g. 1 point every 3-5 s) to keep requests small.
export const MAX_ROUTE_POINTS = 10_000;

export const RoutePointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  t: z.int().min(0), // seconds elapsed since startedAt
});
export type RoutePoint = z.infer<typeof RoutePointSchema>;

// Activities are saved after they finish, so they can't start in the future.
// Small tolerance because phone clocks can be a little ahead of the server.
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;

// Fields shared by create (POST) and update (PATCH).
// Missing measurement = null, never 0 (spec rule).
export const activityFields = {
  startedAt: z.iso
    .datetime({ offset: true })
    .refine((d) => new Date(d).getTime() <= Date.now() + CLOCK_TOLERANCE_MS, {
      message: 'startedAt cannot be in the future',
    }),
  durationSeconds: z.int().min(1).max(86_400),
  distanceMeters: z.int().min(1).max(1_000_000).nullable(),
  elevationGainMeters: z.int().min(0).max(20_000).nullable(),
  effort: z.enum(EffortLevel).nullable(),
  note: z.string().trim().max(500).nullable(),
};

export const activityEnums = {
  type: z.enum(ActivityType),
  source: z.enum(ActivitySource),
};