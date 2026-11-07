import { Module } from '@nestjs/common';
import { GoalService } from './goal.service.js';
import { GoalController } from './goal.controller.js';

@Module({
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
