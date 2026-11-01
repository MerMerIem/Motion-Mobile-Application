import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthTokens } from './dto/auth-tokens.dto.js';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError,
  ApiValidationError,
} from '../common/decorators/api-docs.decorator.js';
import { AuthTokensDto } from './dto/auth-tokens.dto.js';

@Controller('auth')
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

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
