import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Profile } from '../generated/prisma/client.js';
import type { ProfileResponse } from './dto/profile.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.toResponse(profile);
  }

  async update(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const current = await this.prisma.profile.findUnique({ where: { userId } });
    if (!current) throw new NotFoundException('Profile not found');

    // Cross-field rule on the merged result: a reminder needs a time
    const reminderEnabled = dto.reminderEnabled ?? current.reminderEnabled;
    const reminderTime =
      dto.reminderTime !== undefined ? dto.reminderTime : current.reminderTime;
    if (reminderEnabled && !reminderTime) {
      throw new BadRequestException(
        'reminderTime is required when reminders are enabled',
      );
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...dto,
        // dedupe list fields
        preferredActivities: dto.preferredActivities && [
          ...new Set(dto.preferredActivities),
        ],
        preferredDays: dto.preferredDays && [...new Set(dto.preferredDays)],
      },
    });
    return this.toResponse(updated);
  }

  // Only what the recommender actually uses (spec: "ask only what you use")
  private isSetupCompleted(p: Profile): boolean {
    return (
      p.mainGoal !== null &&
      p.experienceLevel !== null &&
      p.preferredActivities.length > 0 &&
      p.daysPerWeek !== null &&
      p.minutesPerSession !== null
    );
  }

  private toResponse(p: Profile): ProfileResponse {
    return {
      mainGoal: p.mainGoal,
      experienceLevel: p.experienceLevel,
      preferredActivities: p.preferredActivities,
      daysPerWeek: p.daysPerWeek,
      minutesPerSession: p.minutesPerSession,
      preferredDays: p.preferredDays,
      timezone: p.timezone,
      reminderEnabled: p.reminderEnabled,
      reminderTime: p.reminderTime,
      setupCompleted: this.isSetupCompleted(p),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
