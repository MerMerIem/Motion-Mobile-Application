import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 400 }),
  error: z.string().meta({ example: 'Bad Request' }),
  message: z.string().meta({ example: 'Validation failed' }),
  details: z
    .array(
      z.object({
        field: z.string().meta({ example: 'email' }),
        message: z.string().meta({ example: 'Invalid email address' }),
      }),
    )
    .optional(),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}