import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  Activity,
  ActivityRoute,
  Prisma,
} from '../generated/prisma/client.js';
import { ActivitySource } from '../generated/prisma/enums.js';
import type { RoutePoint } from './dto/activity-fields.js';
import type {
  ActivityDetailResponse,
  ActivityListItemResponse,
  ActivityListResponse,
} from './dto/activity.dto.js';
import type { CreateActivityDto } from './dto/create-activity.dto.js';
import type { ListActivitiesQueryDto } from './dto/list-activities.query.js';
import { SENSOR_FIELDS } from './dto/update-activity.dto.js';
import type { UpdateActivityDto } from './dto/update-activity.dto.js';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityDetailResponse> {
    if (dto.recommendationId) {
      await this.assertRecommendationOwned(userId, dto.recommendationId);
    }

    // Nested create: Activity + ActivityRoute are written in ONE transaction,
    // so we never end up with a GPS activity without its route.
    const activity = await this.prisma.activity.create({
      data: {
        userId,
        type: dto.type,
        source: dto.source,
        startedAt: new Date(dto.startedAt),
        durationSeconds: dto.durationSeconds,
        distanceMeters: dto.distanceMeters,
        elevationGainMeters: dto.elevationGainMeters,
        effort: dto.effort,
        note: dto.note,
        recommendationId: dto.recommendationId,
        route: dto.route ? { create: { points: dto.route } } : undefined,
      },
      include: { route: true },
    });
    return this.toDetail(activity);
  }

  async list(
    userId: string,
    q: ListActivitiesQueryDto,
  ): Promise<ActivityListResponse> {
    const where: Prisma.ActivityWhereInput = {
      userId,
      ...(q.type && { type: q.type }),
      ...((q.from || q.to) && {
        startedAt: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        // id as tie-breaker keeps the order stable between pages
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: { route: { select: { id: true } } },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      items: rows.map((a) => this.toListItem(a)),
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
    };
  }

  async get(userId: string, id: string): Promise<ActivityDetailResponse> {
    // Filtering on userId too: someone else's activity looks like "not found"
    const activity = await this.prisma.activity.findFirst({
      where: { id, userId },
      include: { route: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return this.toDetail(activity);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityDetailResponse> {
    const current = await this.prisma.activity.findFirst({
      where: { id, userId },
      select: { source: true },
    });
    if (!current) throw new NotFoundException('Activity not found');

    if (current.source === ActivitySource.Gps) {
      const touched = SENSOR_FIELDS.filter((f) => dto[f] !== undefined);
      if (touched.length > 0) {
        throw new BadRequestException(
          `GPS-measured values cannot be edited: ${touched.join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      },
      include: { route: true },
    });
    return this.toDetail(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    // Route is removed too (onDelete: Cascade)
    const { count } = await this.prisma.activity.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Activity not found');
  }

  private async assertRecommendationOwned(userId: string, id: string) {
    const rec = await this.prisma.recommendation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!rec) throw new BadRequestException('Unknown recommendationId');
  }

  private toListItem(
    a: Activity & { route: { id: string } | null },
  ): ActivityListItemResponse {
    return {
      id: a.id,
      type: a.type,
      source: a.source,
      startedAt: a.startedAt.toISOString(),
      durationSeconds: a.durationSeconds,
      distanceMeters: a.distanceMeters,
      elevationGainMeters: a.elevationGainMeters,
      effort: a.effort,
      hasRoute: a.route !== null,
    };
  }

  private toDetail(
    a: Activity & { route: ActivityRoute | null },
  ): ActivityDetailResponse {
    return {
      id: a.id,
      type: a.type,
      source: a.source,
      startedAt: a.startedAt.toISOString(),
      durationSeconds: a.durationSeconds,
      distanceMeters: a.distanceMeters,
      elevationGainMeters: a.elevationGainMeters,
      effort: a.effort,
      note: a.note,
      recommendationId: a.recommendationId,
      route: a.route ? (a.route.points as RoutePoint[]) : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
