import {
  Controller,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthTokens } from './dto/auth-tokens.dto.js';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ApiError,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';
import { AuthTokensDto } from './dto/auth-tokens.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { SuccessDto } from './dto/success.dto.js';
import type { Success } from './dto/success.dto.js';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create an account and get tokens' })
  @ApiCreatedResponse({ type: AuthTokensDto })
  @ApiValidationError()
  @ApiError(409, 'Email already in use')
  register(@Body() dto: RegisterDto): Promise<AuthTokens> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in and get tokens' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiValidationError()
  @ApiError(401, 'Invalid email or password')
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Swap a refresh token for a new token pair' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiError(401, 'Invalid, revoked or expired refresh token')
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke the refresh token' })
  @ApiOkResponse({ type: SuccessDto })
  @ApiError(401, 'Invalid refresh token')
  logout(@Body() dto: RefreshDto): Promise<Success> {
    return this.auth.logout(dto.refreshToken);
  }
}
