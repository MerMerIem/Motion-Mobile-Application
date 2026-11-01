import { Module } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ExceptionsFilter } from './common/filters/exceptions.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: ExceptionsFilter },
  ],
})
export class AppModule {}