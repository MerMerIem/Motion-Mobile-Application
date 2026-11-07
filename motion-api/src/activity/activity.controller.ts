import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service.js';
import { ActivityDetailDto, ActivityListDto } from './dto/activity.dto.js';
import type {
  ActivityDetailResponse,
  ActivityListResponse,
} from './dto/activity.dto.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { ListActivitiesQueryDto } from './dto/list-activities.query.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import {
  ApiError,
  ApiProtected,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';

@Controller('activities')
@ApiTags('Activities')
@UseGuards(JwtAuthGuard)
@ApiProtected()
export class ActivityController {
  constructor(private readonly activities: ActivityService) {}

  @Post()
  @ApiOperation({
    summary:
      'Save a finished activity (source Gps needs a route, Manual must not have one)',
  })
  @ApiCreatedResponse({ type: ActivityDetailDto })
  @ApiValidationError()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateActivityDto,
  ): Promise<ActivityDetailResponse> {
    return this.activities.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'My activities, newest first (paginated, filter by type/period)',
  })
  @ApiOkResponse({ type: ActivityListDto })
  @ApiValidationError()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListActivitiesQueryDto,
  ): Promise<ActivityListResponse> {
    return this.activities.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Activity detail (includes the route if any)' })
  @ApiOkResponse({ type: ActivityDetailDto })
  @ApiError(400, 'Invalid activity id (uuid expected)')
  @ApiError(404, 'Activity not found')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ActivityDetailResponse> {
    return this.activities.get(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Edit an activity (time/distance/elevation only for Manual activities)',
    description:
      'A 400 can have two shapes: field validation errors (with `details`), ' +
      'or, when editing startedAt/durationSeconds/distanceMeters/' +
      'elevationGainMeters of a GPS activity, a plain `message` such as ' +
      '"GPS-measured values cannot be edited: distanceMeters".',
  })
  @ApiOkResponse({ type: ActivityDetailDto })
  @ApiValidationError()
  @ApiError(404, 'Activity not found')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityDetailResponse> {
    return this.activities.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an activity (and its route)' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiError(400, 'Invalid activity id (uuid expected)')
  @ApiError(404, 'Activity not found')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.activities.remove(user.id, id);
  }
}
