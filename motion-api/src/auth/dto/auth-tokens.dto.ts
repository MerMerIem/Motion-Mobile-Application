import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export class AuthTokensDto extends createZodDto(AuthTokensSchema) {}
export type AuthTokens = z.infer<typeof AuthTokensSchema>;