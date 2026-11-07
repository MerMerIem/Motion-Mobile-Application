import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoalService } from './goal.service.js';
import { GoalDto } from './dto/goal.dto.js';
import type { GoalResponse } from './dto/goal.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import {
  ApiProtected,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';

@Controller('goals')
@ApiTags('Goals')
@UseGuards(JwtAuthGuard)
@ApiProtected()
export class GoalController {
  constructor(private readonly goals: GoalService) {}

  @Get()
  @ApiOperation({
    summary: 'Get my weekly goals (all targets null if none set)',
  })
  @ApiOkResponse({ type: GoalDto })
  get(@CurrentUser() user: AuthUser): Promise<GoalResponse> {
    return this.goals.get(user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Set or partially update my weekly goals (null disables a target)',
  })
  @ApiOkResponse({ type: GoalDto })
  @ApiValidationError()
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponse> {
    return this.goals.update(user.id, dto);
  }
}