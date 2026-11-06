import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ActivityType,
  ExperienceLevel,
  MainGoal,
  PreferredDays,
} from '../../generated/prisma/enums.js';

export const ProfileSchema = z.object({
  mainGoal: z.enum(MainGoal).nullable(),
  experienceLevel: z.enum(ExperienceLevel).nullable(),
  preferredActivities: z.array(z.enum(ActivityType)),
  daysPerWeek: z.number().nullable(),
  minutesPerSession: z.number().nullable(),
  preferredDays: z.array(z.enum(PreferredDays)),
  timezone: z.string(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable(),
  setupCompleted: z.boolean(), // drives the splash routing
  updatedAt: z.string(),
});

export class ProfileDto extends createZodDto(ProfileSchema) {}
export type ProfileResponse = z.infer<typeof ProfileSchema>;