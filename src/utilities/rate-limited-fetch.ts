/**
 * Rate-Limited Fetch Utility
 *
 * Provides a throttled fetch mechanism for CityCoins API requests.
 * Uses evenly-spaced requests (1 per second) to avoid 429 rate limits.
 * Handles 429 responses with Retry-After header support.
 *
 * All CityCoins API calls (legacy + protocol) should use this utility
 * to ensure we never exceed the Hiro API rate limits that both APIs wrap.
 */

// =============================================================================
// THROTTLED QUEUE
// =============================================================================

/**
 * A queue that ensures requests are evenly spaced at 1 per second.
 * This is more reliable than burst traffic with delays.
 */
class ThrottledQueue {
  private lastRequest = 0;
  private readonly minDelay = 1000; // 1 second between requests
  private queue: Array<{ resolve: () => void }> = [];
  private processing = false;

  /**
   * Wait for your turn in the queue.
   * Resolves when it's safe to make the next request.
   */
  async waitForTurn(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ resolve });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequest;

      if (elapsed < this.minDelay) {
        await sleep(this.minDelay - elapsed);
      }

      this.lastRequest = Date.now();
      const next = this.queue.shift();
      next?.resolve();
    }

    this.processing = false;
  }

  /**
   * Get the current queue length (for debugging/progress)
   */
  get length(): number {
    return this.queue.length;
  }
}

// Single shared queue for all CityCoins API requests
export const apiQueue = new ThrottledQueue();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Async sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Retry-After header value
 * Supports both seconds (integer) and HTTP-date formats
 *
 * @returns milliseconds to wait, or null if header is missing/invalid
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  // Try parsing as seconds (integer)
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as HTTP-date
  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

// =============================================================================
// RATE-LIMITED FETCH
// =============================================================================

export interface RateLimitedFetchOptions {
  /** Maximum number of retries on 429 (default: 3) */
  maxRetries?: number;
  /** Whether to parse response as JSON (default: true) */
  json?: boolean;
}

export interface RateLimitedFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Fetch with rate limiting and 429 handling.
 *
 * - Waits for turn in the throttled queue (1 req/sec)
 * - Handles 429 responses with Retry-After header
 * - Falls back to exponential backoff if no Retry-After
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The response data or error
 */
export async function rateLimitedFetch<T = unknown>(
  url: string,
  options: RateLimitedFetchOptions = {}
): Promise<RateLimitedFetchResult<T>> {
  const { maxRetries = 3, json = true } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait for our turn in the queue
    await apiQueue.waitForTurn();

    try {
      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
        const waitMs = retryAfter || 1000 * Math.pow(2, attempt + 1);
        await sleep(waitMs);
        continue;
      }

      // Handle non-OK responses
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Parse response
      const data = json ? await response.json() : await response.text();

      return {
        ok: true,
        status: response.status,
        data: data as T,
      };
    } catch (error) {
      // Network error on last attempt
      if (attempt === maxRetries) {
        return {
          ok: false,
          status: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }

      // Retry with backoff
      const waitMs = 1000 * Math.pow(2, attempt);
      await sleep(waitMs);
    }
  }

  return {
    ok: false,
    status: 0,
    error: `Max retries (${maxRetries}) exceeded for ${url}`,
  };
}

/**
 * Convenience wrapper that throws on error.
 * Use when you want to handle errors with try/catch.
 */
export async function rateLimitedFetchOrThrow<T = unknown>(
  url: string,
  options: RateLimitedFetchOptions = {}
): Promise<T> {
  const result = await rateLimitedFetch<T>(url, options);

  if (!result.ok) {
    throw new Error(result.error || `Request failed with status ${result.status}`);
  }

  return result.data as T;
}
