import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Goal } from '../generated/prisma/client.js';
import type { GoalResponse } from './dto/goal.dto.js';
import type { UpdateGoalDto } from './dto/update-goal.dto.js';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  // No goal yet is a normal state, not an error: return all-null, not 404.
  async get(userId: string): Promise<GoalResponse> {
    const goal = await this.prisma.goal.findUnique({ where: { userId } });
    return this.toResponse(goal);
  }

  // Upsert: the row is created lazily on the first PATCH.
  async update(userId: string, dto: UpdateGoalDto): Promise<GoalResponse> {
    const goal = await this.prisma.goal.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
    return this.toResponse(goal);
  }

  private toResponse(g: Goal | null): GoalResponse {
    return {
      targetSessions: g?.targetSessions ?? null,
      targetMinutes: g?.targetMinutes ?? null,
      targetDistanceMeters: g?.targetDistanceMeters ?? null,
      updatedAt: g?.updatedAt.toISOString() ?? null,
    };
  }
}