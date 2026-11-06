import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service.js';
import { ProfileDto } from './dto/profile.dto.js';
import type { ProfileResponse } from './dto/profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import {
  ApiError,
  ApiProtected,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';

@Controller('profile')
@ApiTags('Profile')
@UseGuards(JwtAuthGuard)
@ApiProtected()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get my profile (includes setupCompleted)' })
  @ApiOkResponse({ type: ProfileDto })
  @ApiError(404, 'Profile not found')
  get(@CurrentUser() user: AuthUser): Promise<ProfileResponse> {
    return this.profile.get(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update my profile' })
  @ApiOkResponse({ type: ProfileDto })
  @ApiValidationError()
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.profile.update(user.id, dto);
  }
}
