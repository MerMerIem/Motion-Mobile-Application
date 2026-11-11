import { Test, TestingModule } from '@nestjs/testing';
import { InsightController } from './insight.controller.js';
import { InsightService } from './insight.service.js';

describe('InsightController', () => {
  let controller: InsightController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightController],
      providers: [InsightService],
    }).compile();

    controller = module.get<InsightController>(InsightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
