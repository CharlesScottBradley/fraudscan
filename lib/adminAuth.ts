import { NextRequest, NextResponse } from 'next/server';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minute window for counting attempts

// In-memory store for failed attempts (per IP)
interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const failedAttempts = new Map<string, FailedAttempt>();

// Clean up old entries periodically
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, attempt] of failedAttempts.entries()) {
    // Remove if lockout expired and window passed
    if (
      attempt.lockedUntil &&
      attempt.lockedUntil < now &&
      attempt.firstAttempt + ATTEMPT_WINDOW_MS < now
    ) {
      failedAttempts.delete(ip);
    }
    // Remove if no lockout and window passed
    else if (!attempt.lockedUntil && attempt.firstAttempt + ATTEMPT_WINDOW_MS < now) {
      failedAttempts.delete(ip);
    }
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function isLockedOut(ip: string): { locked: boolean; remainingSeconds?: number } {
  const attempt = failedAttempts.get(ip);
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (attempt.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((attempt.lockedUntil - now) / 1000),
    };
  }

  // Lockout expired, reset
  failedAttempts.delete(ip);
  return { locked: false };
}

function recordFailedAttempt(ip: string): { locked: boolean; attemptsRemaining: number } {
  const now = Date.now();
  let attempt = failedAttempts.get(ip);

  if (!attempt || attempt.firstAttempt + ATTEMPT_WINDOW_MS < now) {
    // Start new window
    attempt = {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    };
  } else {
    attempt.count++;
  }

  // Check if should lock out
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
    failedAttempts.set(ip, attempt);
    return { locked: true, attemptsRemaining: 0 };
  }

  failedAttempts.set(ip, attempt);
  return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS - attempt.count };
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export interface AdminAuthResult {
  authorized: boolean;
  error?: string;
  status?: number;
}

/**
 * Verify admin credentials from Basic Auth header
 *
 * Usage in API route:
 * ```
 * const auth = verifyAdminAuth(request);
 * if (!auth.authorized) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status });
 * }
 * ```
 */
export function verifyAdminAuth(request: NextRequest): AdminAuthResult {
  // Periodic cleanup
  if (Math.random() < 0.1) {
    cleanupOldEntries();
  }

  const ip = getClientIP(request);

  // Check lockout first
  const lockoutStatus = isLockedOut(ip);
  if (lockoutStatus.locked) {
    return {
      authorized: false,
      error: `Too many failed attempts. Try again in ${lockoutStatus.remainingSeconds} seconds.`,
      status: 429,
    };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return {
      authorized: false,
      error: 'Authentication required',
      status: 401,
    };
  }

  try {
    // Decode Base64 credentials
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      console.error('Admin credentials not configured in environment');
      return {
        authorized: false,
        error: 'Server configuration error',
        status: 500,
      };
    }

    // Timing-safe comparison to prevent timing attacks
    const usernameMatch =
      username.length === expectedUsername.length &&
      timingSafeEqual(username, expectedUsername);
    const passwordMatch =
      password.length === expectedPassword.length &&
      timingSafeEqual(password, expectedPassword);

    if (usernameMatch && passwordMatch) {
      clearFailedAttempts(ip);
      return { authorized: true };
    }

    // Record failed attempt
    const failResult = recordFailedAttempt(ip);

    if (failResult.locked) {
      return {
        authorized: false,
        error: `Too many failed attempts. Locked out for 15 minutes.`,
        status: 429,
      };
    }

    return {
      authorized: false,
      error: `Invalid credentials. ${failResult.attemptsRemaining} attempts remaining.`,
      status: 401,
    };
  } catch {
    return {
      authorized: false,
      error: 'Invalid authorization header format',
      status: 400,
    };
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(auth: AdminAuthResult): NextResponse {
  const response = NextResponse.json(
    { error: auth.error },
    { status: auth.status }
  );

  // Add WWW-Authenticate header for 401 responses
  if (auth.status === 401) {
    response.headers.set('WWW-Authenticate', 'Basic realm="Admin"');
  }

  return response;
}
