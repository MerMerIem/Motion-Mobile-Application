import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { StatsModule } from '../stats/stats.module.js';
import { InsightFactsService } from './insight.service.js';

@Module({
  imports: [ProfileModule, StatsModule],
  providers: [InsightFactsService],
  exports: [InsightFactsService],
})
export class InsightModule {}