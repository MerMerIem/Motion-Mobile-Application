import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthTokens } from './dto/auth-tokens.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    // Zod already trimmed and lowercased the email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        profile: { create: {} }, // empty profile = "setup not finished"
      },
    });

    return this.issueTokens(user.id, user.email);
  }

  // ---------- helpers ----------

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens>{
    const accessToken = await this.jwt.signAsync({ sub: userId, email });

    const refreshToken = randomBytes(48).toString('hex');
    const days = Number(this.config.get('REFRESH_TOKEN_DAYS') ?? 30);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(refreshToken), // only the hash is stored
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}