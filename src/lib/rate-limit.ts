interface RateLimitOptions {
  interval: number; // in milliseconds
  uniqueTokenPerInterval?: number; // max users tracked
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new Map<string, number[]>();
  const { interval, uniqueTokenPerInterval = 500 } = options;

  return {
    check: async (limit: number, token: string): Promise<boolean> => {
      const now = Date.now();
      const windowStart = now - interval;

      // Clean up cache if too large
      if (tokenCache.size > uniqueTokenPerInterval) {
        tokenCache.clear();
      }

      const timestamps = tokenCache.get(token) || [];
      const validTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

      if (validTimestamps.length >= limit) {
        return false;
      }

      validTimestamps.push(now);
      tokenCache.set(token, validTimestamps);
      return true;
    },
  };
}
