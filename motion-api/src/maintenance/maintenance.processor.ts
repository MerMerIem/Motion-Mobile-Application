import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';

export const MAINTENANCE_QUEUE = 'maintenance';
export const CLEANUP_TOKENS_JOB = 'cleanup-refresh-tokens';

const REVOKED_KEEP_DAYS = 7;

@Processor(MAINTENANCE_QUEUE)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ deleted: number }> {
    switch (job.name) {
      case CLEANUP_TOKENS_JOB:
        return this.cleanupRefreshTokens();
      default:
        this.logger.warn(`Unknown job "${job.name}"`);
        return { deleted: 0 };
    }
  }

  private async cleanupRefreshTokens() {
    const now = new Date();
    const revokedBefore = new Date(
      now.getTime() - REVOKED_KEEP_DAYS * 24 * 60 * 60 * 1000,
    );

    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } }, // expired
          { revokedAt: { lt: revokedBefore } }, // revoked long ago
        ],
      },
    });

    this.logger.log(`Cleanup: ${count} refresh token(s) deleted`);
    return { deleted: count };
  }
}
