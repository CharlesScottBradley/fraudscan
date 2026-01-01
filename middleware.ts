import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getRateLimitHeaders,
  DEFAULT_RATE_LIMIT,
  STRICT_RATE_LIMIT,
  type RateLimitConfig,
} from './lib/rateLimit';

/**
 * Middleware for rate limiting API endpoints
 *
 * Supports:
 * - IP-based rate limiting (100 req/min GET, 10 req/min POST)
 * - API key authentication with custom rate limits
 *
 * API keys can be passed via:
 * - Authorization: Bearer sk_live_...
 * - X-API-Key: sk_live_...
 *
 * Excludes:
 * - Admin routes (handled separately with auth)
 * - Non-API routes
 */

// Simple API key format validation (full validation happens in route handlers)
function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('sk_live_') && key.length === 40;
}

// Extract API key from request
function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    if (isValidApiKeyFormat(key)) {
      return key;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && isValidApiKeyFormat(apiKeyHeader)) {
    return apiKeyHeader;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for admin routes (they should have auth)
  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.next();
  }

  // Get IP from headers (works with proxies/CDNs)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  // Check for API key - if present, use key-based rate limiting
  const apiKey = extractApiKey(request);
  let identifier: string;
  let config: RateLimitConfig;

  if (apiKey) {
    // API key users get higher limits and are identified by key, not IP
    // Note: Full key validation (checking database) happens in route handlers
    // Middleware just does basic format check and rate limiting
    identifier = `apikey:${apiKey}`;
    // API key users get 1000 req/min by default (can be customized per key in DB)
    config = { limit: 1000, windowMs: 60 * 1000 };
  } else {
    // IP-based rate limiting for anonymous users
    const method = request.method.toUpperCase();
    config =
      method === 'POST' || method === 'PUT' || method === 'DELETE'
        ? STRICT_RATE_LIMIT
        : DEFAULT_RATE_LIMIT;

    // Create unique identifier: IP + endpoint (to prevent abuse of single endpoints)
    identifier = `${ip}:${pathname}`;
  }

  const result = checkRateLimit(identifier, config);
  const headers = getRateLimitHeaders(result);

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          ...headers,
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes except static files
    '/api/:path*',
  ],
};
