import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { RecommendationService } from './recommendation.service.js';
import { RECOMMENDATION_QUEUE } from './recommendation.queue.js';

@Processor(RECOMMENDATION_QUEUE)
export class RecommendationProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationProcessor.name);

  constructor(private readonly service: RecommendationService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;
    this.logger.log(`Job ${job.id}: attempt ${job.attemptsMade + 1}/${maxAttempts}`);
    await this.service.runGeneration(job.data.userId, job.attemptsMade, isLastAttempt);
  }
}