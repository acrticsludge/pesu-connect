interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number | Record<string, number>;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number | Record<string, number>;
  private cache: Map<string, RateLimitRecord>;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.cache = new Map();
  }

  private getMaxRequests(key: string): number {
    if (typeof this.maxRequests === "number") {
      return this.maxRequests;
    }

    const method = key.split("-")[0];
    return this.maxRequests[method] || this.maxRequests["GET"] || 50;
  }

  async check(key: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const record = this.cache.get(key);
    const maxRequests = this.getMaxRequests(key);

    if (!record || now >= record.resetTime) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    if (record.count >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count += 1;
    this.cache.set(key, record);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - record.count,
      reset: record.resetTime,
    };
  }
}
