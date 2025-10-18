import { redis } from "@/lib/redis";

interface RateLimitParams {
  key: string;
  limit: number;
  windowSeconds?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimitError extends Error {
  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function assertRateLimit({ key, limit, windowSeconds = 60 }: RateLimitParams): Promise<RateLimitResult> {
  const redisKey = `rate:${key}`;
  const currentCount = await redis.incr(redisKey);

  if (currentCount === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (currentCount > limit) {
    const resetAt = Date.now() + windowSeconds * 1000;
    throw new RateLimitError(`Rate limit exceeded. Try again in ${windowSeconds} seconds.`);
  }

  return {
    success: true,
    remaining: limit - currentCount,
    resetAt: Date.now() + windowSeconds * 1000,
  };
}
