import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  CLEANUP_TOKENS_JOB,
  MAINTENANCE_QUEUE,
} from './maintenance.processor.js';

@Injectable()
export class MaintenanceScheduler implements OnModuleInit {
  constructor(@InjectQueue(MAINTENANCE_QUEUE) private queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'cleanup-refresh-tokens-daily', // the schedule's id
      { pattern: '0 3 * * *', tz: 'Africa/Algiers' }, // every day at 03:00
      {
        name: CLEANUP_TOKENS_JOB,
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 20, // keep the last 20 finished jobs
          removeOnFail: 50, // keep the last 50 failed ones for debugging
        },
      },
    );
  }
}
