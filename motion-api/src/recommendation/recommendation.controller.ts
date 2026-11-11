import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service.js';
import { FeedbackDto } from './dto/feedback.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { ApiProtected } from '../common/decorators/api-docs.decorator.js';
import { ApiValidationError } from '../common/decorators/api-docs.decorator.js';

@Controller('recommendations')
@ApiTags('Recommendations')
@UseGuards(JwtAuthGuard)
@ApiProtected()
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Get('next')
  @ApiOperation({ summary: 'Get my next recommended activity' })
  next(@CurrentUser() user: AuthUser) {
    return this.service.getNext(user.id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a recommendation' })
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.accept(user.id, id);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a recommendation' })
  dismiss(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.dismiss(user.id, id);
  }

  @Put(':id/feedback')
  @ApiOperation({ summary: 'Give feedback on a recommendation' })
  @ApiOkResponse({ type: FeedbackDto })
  @ApiValidationError()
  feedback(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeedbackDto,
  ) {
    return this.service.feedback(user.id, id, dto.type);
  }
}
