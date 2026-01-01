/**
 * Simple in-memory rate limiter for API endpoints
 *
 * For production at scale, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Cloudflare Rate Limiting
 *
 * This in-memory implementation works well for single-instance deployments
 * but won't share state across serverless function instances.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store request counts by IP
const requestCounts = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.resetTime < now) {
      requestCounts.delete(key);
    }
  }
}

export interface RateLimitConfig {
  limit: number;      // Max requests per window
  windowMs: number;   // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60 * 1000 }
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = requestCounts.get(identifier);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    requestCounts.set(identifier, newEntry);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Default rate limit configuration
 * 100 requests per minute per IP
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Stricter rate limit for write operations
 * 10 requests per minute per IP
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
};
