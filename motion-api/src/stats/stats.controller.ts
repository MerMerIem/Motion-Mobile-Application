import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service.js';
import { SummaryStatsDto, WeeklyStatsDto } from './dto/stats.dto.js';
import type {
  SummaryStatsResponse,
  WeeklyStatsResponse,
} from './dto/stats.dto.js';
import { SummaryStatsQueryDto } from './dto/summary-stats.query.js';
import { WeeklyStatsQueryDto } from './dto/weekly-stats.query.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import {
  ApiProtected,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';

@Controller('stats')
@ApiTags('Stats')
@UseGuards(JwtAuthGuard)
@ApiProtected()
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('weekly')
  @ApiOperation({
    summary:
      'This week (Sunday to Saturday, in my timezone): totals, per-sport numbers, per-day activities and goal progress',
  })
  @ApiOkResponse({ type: WeeklyStatsDto })
  @ApiValidationError()
  weekly(
    @CurrentUser() user: AuthUser,
    @Query() query: WeeklyStatsQueryDto,
  ): Promise<WeeklyStatsResponse> {
    return this.stats.weekly(user.id, query);
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Summary of any period (optionally one sport): session count, duration, distance',
  })
  @ApiOkResponse({ type: SummaryStatsDto })
  @ApiValidationError()
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: SummaryStatsQueryDto,
  ): Promise<SummaryStatsResponse> {
    return this.stats.summary(user.id, query);
  }
}