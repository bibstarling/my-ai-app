/**
 * HTTP fetch with retries (exponential backoff) and optional rate limiting.
 */

const DEFAULT_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'JobIngestion/1.0',
          ...(options.headers as Record<string, string>),
        },
      });
      if (res.ok || res.status === 404) return res;
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
        if (attempt < retries) {
          await sleep(backoff);
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
          continue;
        }
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await sleep(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    }
  }
  throw lastError ?? new Error('fetchWithRetry failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simple in-memory rate limiter: max N calls per windowMs. */
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, windowMs: number, maxPerWindow: number): Promise<void> {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateLimitBuckets.set(key, bucket);
  }
  bucket.count++;
  if (bucket.count > maxPerWindow) {
    const wait = bucket.resetAt - now;
    if (wait > 0) await sleep(wait);
    rateLimitBuckets.set(key, { count: 1, resetAt: Date.now() + windowMs });
  }
}
