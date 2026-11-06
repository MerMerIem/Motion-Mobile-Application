import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ActivityType,
  ExperienceLevel,
  MainGoal,
  PreferredDays,
} from '../../generated/prisma/enums.js';

const isValidTimezone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// PATCH semantics: field missing = untouched, null = cleared
export const UpdateProfileSchema = z
  .object({
    mainGoal: z.enum(MainGoal).nullable(),
    experienceLevel: z.enum(ExperienceLevel).nullable(),
    preferredActivities: z.array(z.enum(ActivityType)).max(4),
    daysPerWeek: z.int().min(1).max(7).nullable(),
    minutesPerSession: z.int().min(10).max(300).nullable(),
    preferredDays: z.array(z.enum(PreferredDays)).max(7),
    timezone: z.string().refine(isValidTimezone, 'Invalid IANA timezone'),
    reminderEnabled: z.boolean(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm')
      .nullable(),
  })
  .partial()
  .strict();

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}