interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Checks if a given IP address exceeds the allowed submission rate.
 * @param ip Client IP address
 * @returns Object indicating if request is allowed, remaining requests, and retry time.
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const now = Date.now();
  const record = memoryStore.get(ip) || { timestamps: [] };

  // Remove timestamps outside the sliding window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    const oldest = validTimestamps[0];
    const resetTimeMs = oldest + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }

  // Record current request
  validTimestamps.push(now);
  memoryStore.set(ip, { timestamps: validTimestamps });

  // Periodically clean up stale entries (every 100 requests)
  if (memoryStore.size > 500) {
    for (const [key, value] of memoryStore.entries()) {
      const active = value.timestamps.filter((ts) => now - ts < WINDOW_MS);
      if (active.length === 0) {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, { timestamps: active });
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - validTimestamps.length,
    resetTimeMs: WINDOW_MS,
  };
}
