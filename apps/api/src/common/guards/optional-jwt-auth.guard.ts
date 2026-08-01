import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Same as JwtAuthGuard, but never throws — request.user is just undefined if no/invalid token. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: unknown): TUser {
    return (user ?? undefined) as TUser;
  }
}
