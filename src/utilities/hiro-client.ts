/**
 * Hiro API Client with Header-Aware Rate Limiting
 *
 * Reads rate limit headers from Hiro API responses to dynamically adjust
 * request timing. This is more efficient than fixed 1 req/sec throttling
 * and handles variable-cost endpoints correctly.
 *
 * Headers tracked:
 * - x-ratelimit-remaining-stacks-second: per-second remaining quota
 * - x-ratelimit-remaining-stacks-minute: per-minute remaining quota
 * - x-ratelimit-cost-stacks: cost of the request
 * - ratelimit-reset: timestamp when limit resets
 * - retry-after: wait duration on 429
 */

import { cvToHex, ClarityValue } from "@stacks/transactions";

// =============================================================================
// CONSTANTS
// =============================================================================

const HIRO_API_BASE = "https://api.hiro.so";

// Conservative defaults when headers are missing
const DEFAULT_DELAY_MS = 200;
const MIN_DELAY_MS = 50;
const SLOW_DELAY_MS = 500;
const CONTRACT_READ_DELAY_MS = 1100;
const MAX_NORMAL_DELAY_MS = 5000;
const MAX_RATE_LIMIT_DELAY_MS = 65000;
const RATE_LIMIT_BUFFER_MS = 500;

// =============================================================================
// RATE LIMIT STATE
// =============================================================================

interface RateLimitState {
  remainingSecond: number | null;
  remainingMinute: number | null;
  resetAt: number | null;
  cooldownUntil: number | null;
  cost: number | null;
  lastRequest: number;
}

const state: RateLimitState = {
  remainingSecond: null,
  remainingMinute: null,
  resetAt: null,
  cooldownUntil: null,
  cost: null,
  lastRequest: 0,
};

/**
 * Safely parse integer from header value, returning null if invalid
 */
function safeParseInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse rate limit reset headers into an absolute timestamp.
 *
 * Hiro may return a relative second count or an epoch timestamp depending on
 * the gateway. This accepts both forms so we can avoid retrying during a known
 * exhausted window.
 */
function parseResetAt(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  if (parsed > 1_000_000_000_000) {
    return parsed;
  }
  if (parsed > 1_000_000_000) {
    return parsed * 1000;
  }
  return Date.now() + parsed * 1000;
}

function getResetDelay(): number | null {
  if (!state.resetAt) return null;
  return Math.max(0, state.resetAt - Date.now() + RATE_LIMIT_BUFFER_MS);
}

/**
 * Update rate limit state from response headers
 */
function updateRateLimitState(headers: Headers): void {
  state.remainingSecond = safeParseInt(
    headers.get("x-ratelimit-remaining-stacks-second")
  );
  state.remainingMinute = safeParseInt(
    headers.get("x-ratelimit-remaining-stacks-minute")
  );
  state.resetAt = parseResetAt(headers.get("ratelimit-reset"));
  state.cost = safeParseInt(headers.get("x-ratelimit-cost-stacks"));
  state.lastRequest = Date.now();
}

/**
 * Calculate delay before next request based on rate limit state
 */
function calculateDelay(minDelayMs = MIN_DELAY_MS): number {
  if (state.cooldownUntil !== null) {
    const cooldownDelay = state.cooldownUntil - Date.now();
    if (cooldownDelay > 0) {
      return Math.min(MAX_RATE_LIMIT_DELAY_MS, cooldownDelay);
    }
    state.cooldownUntil = null;
  }

  // If we have no state, use conservative default
  if (state.remainingSecond === null && state.remainingMinute === null) {
    return Math.max(DEFAULT_DELAY_MS, minDelayMs);
  }

  // If per-second quota is exhausted, wait until next second
  if (state.remainingSecond !== null && state.remainingSecond <= 0) {
    const elapsed = Date.now() - state.lastRequest;
    return Math.min(
      MAX_RATE_LIMIT_DELAY_MS,
      Math.max(minDelayMs, 1000 - elapsed)
    );
  }

  if (state.remainingMinute !== null && state.remainingMinute <= 0) {
    const resetDelay = getResetDelay() ?? 60_000;
    return Math.min(MAX_RATE_LIMIT_DELAY_MS, Math.max(minDelayMs, resetDelay));
  }

  // If per-minute quota is getting low, spread remaining requests across the
  // current reset window instead of waiting until the bucket is empty.
  if (state.remainingMinute !== null && state.remainingMinute < 25) {
    const resetDelay = getResetDelay();
    if (resetDelay !== null) {
      const spreadDelay = Math.ceil(
        resetDelay / Math.max(1, state.remainingMinute)
      );
      return Math.min(
        MAX_RATE_LIMIT_DELAY_MS,
        Math.max(minDelayMs, spreadDelay)
      );
    }

    return Math.min(
      MAX_NORMAL_DELAY_MS,
      Math.max(
        minDelayMs,
        SLOW_DELAY_MS + Math.max(0, 25 - state.remainingMinute) * 200
      )
    );
  }

  // Otherwise use minimal delay
  return minDelayMs;
}

// =============================================================================
// REQUEST QUEUE
// =============================================================================

interface QueuedRequest {
  run: () => Promise<void>;
  minDelayMs: number;
}

class HiroRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private processingPromise: Promise<void> | null = null;

  async run<T>(minDelayMs: number, task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        minDelayMs,
        run: async () => {
          try {
            resolve(await task());
          } catch (error) {
            reject(error);
          }
        },
      });
      this.startProcessing();
    });
  }

  private startProcessing(): void {
    // If already processing, the existing loop will pick up new items
    if (this.processing) return;

    this.processing = true;
    this.processingPromise = this.processQueue().finally(() => {
      this.processing = false;
      this.processingPromise = null;
    });
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) continue;

      const delay = calculateDelay(next.minDelayMs);
      if (delay > 0) {
        await sleep(delay);
      }

      // Update lastRequest timestamp when request is allowed to proceed
      state.lastRequest = Date.now();

      await next.run();
    }
  }

  get length(): number {
    return this.queue.length;
  }

  /**
   * Reset the queue state.
   * Intended for testing or hot module reloading scenarios.
   */
  reset(): void {
    this.queue = [];
    this.processing = false;
    this.processingPromise = null;
  }
}

export const hiroQueue = new HiroRequestQueue();

/**
 * Reset the global Hiro request queue and rate limit state.
 * Intended for testing or hot module reloading scenarios.
 */
export function resetHiroClientForTesting(): void {
  hiroQueue.reset();
  state.remainingSecond = null;
  state.remainingMinute = null;
  state.resetAt = null;
  state.cooldownUntil = null;
  state.cost = null;
  state.lastRequest = 0;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Retry-After header value
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

// =============================================================================
// RESULT TYPES (compatible with existing RateLimitedFetchResult)
// =============================================================================

export interface HiroClientResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export interface HiroClientOptions {
  maxRetries?: number;
  minDelayMs?: number;
}

// =============================================================================
// HIRO FETCH
// =============================================================================

/**
 * Fetch from Hiro API with header-aware rate limiting
 */
export async function hiroFetch<T = unknown>(
  url: string,
  options: HiroClientOptions & RequestInit = {}
): Promise<HiroClientResult<T>> {
  const { maxRetries = 3, minDelayMs = MIN_DELAY_MS, ...fetchOptions } = options;

  return hiroQueue.run(minDelayMs, async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);

        // Update rate limit state from headers
        updateRateLimitState(response.headers);

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
          const resetDelay = getResetDelay();
          const waitMs = Math.min(
            MAX_RATE_LIMIT_DELAY_MS,
            retryAfter ?? resetDelay ?? 1000 * Math.pow(2, attempt + 1)
          );
          state.cooldownUntil = Date.now() + waitMs;
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

        // Parse JSON response
        const data = await response.json();

        return {
          ok: true,
          status: response.status,
          data: data as T,
        };
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            ok: false,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }

        const waitMs = 1000 * Math.pow(2, attempt);
        await sleep(waitMs);
      }
    }

    return {
      ok: false,
      status: 0,
      error: `Max retries (${maxRetries}) exceeded for ${url}`,
    };
  });
}

// =============================================================================
// CONTRACT READ FUNCTION
// =============================================================================

/**
 * Raw response from Hiro read-only endpoint
 */
interface ReadOnlyResponse {
  okay: boolean;
  result?: string;
  cause?: string;
}

/**
 * Result from a contract read-only call
 */
export interface ContractCallResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Call a read-only contract function using Hiro's raw endpoint.
 * This allows us to track rate limit headers (unlike fetchCallReadOnlyFunction).
 *
 * @param contractAddress - Contract deployer address
 * @param contractName - Contract name
 * @param functionName - Function to call
 * @param functionArgs - Clarity values to pass as arguments
 * @param senderAddress - Address to use as sender (usually same as contractAddress)
 */
export async function callReadOnlyFunction<T = string>(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string
): Promise<ContractCallResult<T>> {
  const url = `${HIRO_API_BASE}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;

  const body = {
    sender: senderAddress,
    arguments: functionArgs.map((arg) => cvToHex(arg)),
  };

  const result = await hiroFetch<ReadOnlyResponse>(url, {
    method: "POST",
    minDelayMs: CONTRACT_READ_DELAY_MS,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
    };
  }

  const response = result.data;
  if (!response) {
    return {
      ok: false,
      error: "Empty response from contract call",
    };
  }

  if (!response.okay) {
    return {
      ok: false,
      error: response.cause || "Contract call failed",
    };
  }

  if (!response.result) {
    return {
      ok: false,
      error: "No result in response",
    };
  }

  // Return the hex-encoded result - caller will decode it
  return {
    ok: true,
    data: response.result as T,
  };
}
