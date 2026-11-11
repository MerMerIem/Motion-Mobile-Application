import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service.js';
import { RecommendationController } from './recommendation.controller.js';
import { StatsModule } from '../stats/stats.module.js';
import { GoalModule } from '../goal/goal.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { RecommendationProcessor } from './recommendation.processor.js';
import { BullModule } from '@nestjs/bullmq';
import { RECOMMENDATION_QUEUE } from './recommendation.queue.js';
import { LLM_PROVIDERS, LlmProvider, OpenAiCompatibleClient } from './llm/llm-provider.js';
import { ConfigService } from '@nestjs/config';
import { InsightModule } from '../insight/insight.module.js';

@Module({
  imports: [
    ProfileModule,
    GoalModule,
    StatsModule,
    InsightModule,
    BullModule.registerQueue({ name: RECOMMENDATION_QUEUE }),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationProcessor,
    {
      provide: LLM_PROVIDERS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LlmProvider[] => {
        const providers: LlmProvider[] = [
          new OpenAiCompatibleClient(
            'groq',
            'https://api.groq.com/openai/v1',
            config.getOrThrow('GROQ_API_KEY'),
            config.getOrThrow('GROQ_MODEL'),
          ),
        ];
        const baseUrl = config.get<string>('LLM2_BASE_URL');
        if (baseUrl) {
          providers.push(
            new   OpenAiCompatibleClient(
              'gemini',
              baseUrl,
              config.getOrThrow('LLM2_API_KEY'),
              config.getOrThrow('LLM2_MODEL'),
            ),
          );
        }
        return providers;
      },
    },
  ],
})
export class RecommendationModule {}
