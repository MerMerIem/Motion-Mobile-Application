import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(1).max(50),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}