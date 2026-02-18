interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private cache: Map<string, RateLimitRecord>;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.cache = new Map();
  }

  async check(key: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const record = this.cache.get(key);

    if (!record || now >= record.resetTime) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count += 1;
    this.cache.set(key, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: record.resetTime,
    };
  }
}
