import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Goal } from '../generated/prisma/client.js';
import type { GoalResponse } from './dto/goal.dto.js';
import type { UpdateGoalDto } from './dto/update-goal.dto.js';

const FIELDS = [
  'targetSessions',
  'targetMinutes',
  'targetDistanceMeters',
] as const;

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  // The current goal
  async get(userId: string): Promise<GoalResponse> {
    return this.toResponse(await this.latest(userId));
  }

  async getInEffect(userId: string, before: Date): Promise<GoalResponse> {
    const goal = await this.prisma.goal.findFirst({
      where: { userId, createdAt: { lt: before } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return this.toResponse(goal);
  }

  async update(userId: string, dto: UpdateGoalDto): Promise<GoalResponse> {
    const current = await this.latest(userId);

    const next = {
      targetSessions:
        dto.targetSessions !== undefined
          ? dto.targetSessions
          : (current?.targetSessions ?? null),
      targetMinutes:
        dto.targetMinutes !== undefined
          ? dto.targetMinutes
          : (current?.targetMinutes ?? null),
      targetDistanceMeters:
        dto.targetDistanceMeters !== undefined
          ? dto.targetDistanceMeters
          : (current?.targetDistanceMeters ?? null),
    };

    const unchanged = FIELDS.every((f) => next[f] === (current?.[f] ?? null));
    if (unchanged) return this.toResponse(current);

    const created = await this.prisma.goal.create({
      data: { userId, ...next },
    });
    return this.toResponse(created);
  }

  private latest(userId: string): Promise<Goal | null> {
    return this.prisma.goal.findFirst({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  // updatedAt = when this version was created (= when the user last changed it)
  private toResponse(g: Goal | null): GoalResponse {
    return {
      targetSessions: g?.targetSessions ?? null,
      targetMinutes: g?.targetMinutes ?? null,
      targetDistanceMeters: g?.targetDistanceMeters ?? null,
      updatedAt: g?.createdAt.toISOString() ?? null,
    };
  }
}