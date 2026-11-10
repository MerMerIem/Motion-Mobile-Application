import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { RECOMMENDATION_QUEUE } from './recommendation.queue.js';

@Processor(RECOMMENDATION_QUEUE)
export class RecommendationProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationProcessor.name);

  async process(job: Job<{ userId: string }>) {
    this.logger.log(`Got job ${job.id} for user ${job.data.userId}`);
  }
}