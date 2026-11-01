import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SuccessSchema = z.object({ success: z.boolean() });

export class SuccessDto extends createZodDto(SuccessSchema) {}
export type Success = z.infer<typeof SuccessSchema>;