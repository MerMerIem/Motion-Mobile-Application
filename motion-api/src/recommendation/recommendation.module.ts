import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service.js';
import { RecommendationController } from './recommendation.controller.js';
import { StatsModule } from '../stats/stats.module.js';
import { GoalModule } from '../goal/goal.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { GroqClient } from './llm/groq.client.js';
import { RecommendationProcessor } from './recommendation.processor.js';
import { BullModule } from '@nestjs/bullmq';
import { RECOMMENDATION_QUEUE } from './recommendation.queue.js';

@Module({
  imports: [
    ProfileModule,
    GoalModule,
    StatsModule,
    BullModule.registerQueue({ name: RECOMMENDATION_QUEUE }),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService, GroqClient, RecommendationProcessor],
})
export class RecommendationModule {}