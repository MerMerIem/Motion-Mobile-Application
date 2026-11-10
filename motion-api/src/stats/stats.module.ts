import { Module } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { StatsController } from './stats.controller.js';
import { ProfileModule } from '../profile/profile.module.js';
import { GoalModule } from '../goal/goal.module.js';

@Module({
  imports: [GoalModule, ProfileModule],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
