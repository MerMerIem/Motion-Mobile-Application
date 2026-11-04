import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MaintenanceProcessor, MAINTENANCE_QUEUE } from './maintenance.processor.js';
import { MaintenanceScheduler } from './maintenance.scheduler.js';

@Module({
  imports: [BullModule.registerQueue({ name: MAINTENANCE_QUEUE })],
  providers: [MaintenanceProcessor, MaintenanceScheduler],
})
export class MaintenanceModule {}