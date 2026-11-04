import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  createdAt: z.string(), // ISO date, e.g. "2026-11-01T13:53:13.000Z"
});

export class UserDto extends createZodDto(UserSchema) {}
export type UserResponse = z.infer<typeof UserSchema>;