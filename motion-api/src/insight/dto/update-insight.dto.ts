import { PartialType } from '@nestjs/swagger';
import { CreateInsightDto } from './create-insight.dto.js';

export class UpdateInsightDto extends PartialType(CreateInsightDto) {}
