import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import passportJwt from 'passport-jwt';

const { ExtractJwt, Strategy } = passportJwt;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // What you return here becomes request.user
  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}