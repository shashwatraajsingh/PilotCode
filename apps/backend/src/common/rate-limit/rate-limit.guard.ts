import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  ttl: number; // Time window in seconds
  limit: number; // Max requests in window
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private redis: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    const key = `rate_limit:${identifier}:${request.route.path}`;
    const current = await this.redis.get(key);

    if (!current) {
      await this.redis.set(key, '1', options.ttl);
      return true;
    }

    const count = parseInt(current, 10);

    if (count >= options.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: options.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.redis.incr(key);
    return true;
  }

  private getIdentifier(request: any): string {
    // Use user ID if authenticated, otherwise use IP
    return request.user?.userId || request.ip;
  }
}
