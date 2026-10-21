import type { VerificationCode, VerificationResult } from '../types/certificates';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Guard & Rate Limiting Module for Public Credential Verification
 *
 * 1. Proactive Guards:
 *    - Strict regex parameter validation (rejects malformed IDs & signatures with 0 DB queries)
 *    - Honeypot bot trap detection
 *    - Fast in-memory response cache (reduces database load on repeat checks)
 *
 * 2. Reactive Guards:
 *    - Sliding-window IP rate limiter: 5 verification requests per 60 seconds per IP
 *    - Cooldown / HTTP 429 Retry-After response headers
 *    - Reverse-proxy IP resolution (Cloudflare, Vercel, Nginx, local)
 *    - Authorized administrator bypass
 */

// Rate Limiter Configuration
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
export const RATE_LIMIT_MAX_REQUESTS = 5;    // 5 requests per window

// Sliding-window storage: IP -> Array of timestamps (ms)
const ipRequestTimestamps = new Map<string, number[]>();

// In-Memory Cache for fast repeated lookups (TTL 30s)
const verificationResultCache = new Map<string, { result: VerificationResult; expiresAt: number }>();

// Cleanup stale rate limit & cache entries periodically
let lastCleanup = Date.now();
function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < 30_000) return; // Clean at most once every 30 seconds
  lastCleanup = now;

  // Cleanup rate limiter map
  for (const [ip, timestamps] of ipRequestTimestamps.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRequestTimestamps.delete(ip);
    } else {
      ipRequestTimestamps.set(ip, valid);
    }
  }

  // Cleanup cache map
  for (const [key, entry] of verificationResultCache.entries()) {
    if (now >= entry.expiresAt) {
      verificationResultCache.delete(key);
    }
  }
}

/**
 * Extract client IP address reliably across Cloudflare, Vercel, reverse proxies, and local development.
 */
export function getClientIp(request: Request): string {
  // 1. Cloudflare header
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 2. Real IP header (Nginx / Vercel)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // 3. X-Forwarded-For header (first public or client IP)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

/**
 * Determine if request is from an authorized administrator (bypasses public rate limits)
 */
function isAuthorizedAdmin(request: Request): boolean {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-Bypass-Rate-Limit') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return false;

    // Read expected secret
    let secret = process.env.ADMIN_API_SECRET;
    if (!secret) {
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const raw = fs.readFileSync(envPath, 'utf-8');
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('ADMIN_API_SECRET=')) {
              secret = trimmed.replace('ADMIN_API_SECRET=', '').trim().replace(/^["']|["']$/g, '');
              break;
            }
          }
        }
      } catch {}
    }

    return Boolean(secret && token === secret);
  } catch {
    return false;
  }
}

export interface SecurityCheckResult {
  allowed: boolean;
  status: number;
  code?: VerificationCode;
  message?: string;
  retryAfter?: number;
  remaining?: number;
}

/**
 * Strict regex parameter validation (Proactive Guard).
 * Discards malformed IDs, injection attempts, and invalid signatures before database queries.
 */
export function validateVerificationParams(id: string | null | undefined, sig: string | null | undefined): {
  valid: boolean;
  code?: VerificationCode;
  message?: string;
} {
  if (!id || !sig) {
    return {
      valid: false,
      code: 'MISSING_PARAMS',
      message: 'Both Certificate ID and Verification Signature are required.',
    };
  }

  const cleanId = id.trim();
  const cleanSig = sig.trim();

  // ID must match official pattern: PREFIX-YYYY-XXXXXX... (e.g. CERT-, LOA-, LOP-, COQ-)
  const idPattern = /^(CERT|COQ|LOA|LOP|[A-Za-z]{2,6})-\d{4}-[A-Za-z0-9]{4,16}$/;
  if (!idPattern.test(cleanId)) {
    return {
      valid: false,
      code: 'RECORD_NOT_FOUND',
      message: 'Document Identifier format is invalid (e.g. CERT-2026-..., LOA-2026-...).',
    };
  }

  // Signature must be valid Base64URL string (approximately 86 chars for 64-byte Ed25519 signature)
  const sigPattern = /^[A-Za-z0-9_-]{80,90}$/;
  if (!sigPattern.test(cleanSig)) {
    return {
      valid: false,
      code: 'INVALID_SIGNATURE',
      message: 'Verification Signature format is invalid.',
    };
  }

  return { valid: true };
}

/**
 * Honeypot verification (Proactive Guard)
 * Detects automated headless bots filling hidden fields.
 */
export function checkHoneypot(_request: Request, url: URL): boolean {
  const hpParam = url.searchParams.get('_hp_check');
  if (hpParam && hpParam.trim() !== '') {
    return true; // Bot detected!
  }
  return false;
}

/**
 * Reactive Guard: Sliding-Window Rate Limiter
 * Limits each client IP to 5 requests per 60 seconds.
 */
export function checkRateLimit(request: Request): SecurityCheckResult {
  cleanupStaleEntries();

  // Allow authorized admin operations to bypass rate limiting
  if (isAuthorizedAdmin(request)) {
    return { allowed: true, status: 200, remaining: RATE_LIMIT_MAX_REQUESTS };
  }

  const ip = getClientIp(request);
  const now = Date.now();

  const timestamps = (ipRequestTimestamps.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    // Exceeded limit: calculate exact seconds until the oldest request expires
    const oldestTimestamp = timestamps[0];
    const retryAfterMs = oldestTimestamp + RATE_LIMIT_WINDOW_MS - now;
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      status: 429,
      code: 'RATE_LIMITED',
      retryAfter: retryAfterSec,
      remaining: 0,
      message: `Too many verification requests. Maximum ${RATE_LIMIT_MAX_REQUESTS} attempts per minute allowed. Please wait ${retryAfterSec} seconds.`,
    };
  }

  // Record this request
  timestamps.push(now);
  ipRequestTimestamps.set(ip, timestamps);

  return {
    allowed: true,
    status: 200,
    remaining: RATE_LIMIT_MAX_REQUESTS - timestamps.length,
  };
}

/**
 * Combined Security Check (Proactive + Reactive Guards)
 * Evaluates rate limit, honeypot, and parameter structure.
 */
export function enforceSecurityGuards(
  request: Request,
  id: string | null | undefined,
  sig: string | null | undefined
): SecurityCheckResult {
  const url = new URL(request.url);

  // Proactive 1: Honeypot check
  if (checkHoneypot(request, url)) {
    return {
      allowed: false,
      status: 403,
      code: 'DATA_TAMPERED',
      message: 'Automated submission blocked.',
    };
  }

  // Reactive 1: IP Rate Limiting (5 requests / 60 seconds)
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return rateLimit;
  }

  // Proactive 2: Strict format validation before database lookup
  if (id || sig) {
    const formatCheck = validateVerificationParams(id, sig);
    if (!formatCheck.valid) {
      return {
        allowed: false,
        status: formatCheck.code === 'MISSING_PARAMS' ? 400 : 404,
        code: formatCheck.code,
        message: formatCheck.message,
        remaining: rateLimit.remaining,
      };
    }
  }

  return {
    allowed: true,
    status: 200,
    remaining: rateLimit.remaining,
  };
}

/**
 * Fast in-memory cache lookup
 */
export function getCachedVerification(id: string, sig: string): VerificationResult | null {
  const key = `${id.trim()}:${sig.trim()}`;
  const cached = verificationResultCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }
  return null;
}

/**
 * Fast in-memory cache store (30s for verified, 15s for not found)
 */
export function setCachedVerification(id: string, sig: string, result: VerificationResult): void {
  const key = `${id.trim()}:${sig.trim()}`;
  const ttlMs = result.valid ? 30_000 : 15_000;
  verificationResultCache.set(key, {
    result,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate in-memory cache for a certificate ID upon mutation (revoke, update, delete)
 */
export function invalidateCachedVerification(id: string): void {
  const cleanId = id.trim();
  for (const key of verificationResultCache.keys()) {
    if (key.startsWith(`${cleanId}:`)) {
      verificationResultCache.delete(key);
    }
  }
}

/**
 * Reset rate limit cache (for testing purposes)
 */
export function resetSecurityStateForTesting(): void {
  ipRequestTimestamps.clear();
  verificationResultCache.clear();
}
