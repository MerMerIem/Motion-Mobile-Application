import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { activityFields } from './activity-fields.js';

// PATCH semantics: field missing = untouched, null = cleared (where nullable).
// Measured values (time, distance, elevation) can only be edited on MANUAL
// activities; the service rejects them for GPS activities (spec: keep
// user-entered and sensor-measured values distinct).
export const UpdateActivitySchema = z.object(activityFields).partial().strict();

export const SENSOR_FIELDS = [
  'startedAt',
  'durationSeconds',
  'distanceMeters',
  'elevationGainMeters',
] as const;

export class UpdateActivityDto extends createZodDto(UpdateActivitySchema) {}