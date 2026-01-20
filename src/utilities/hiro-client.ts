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

// =============================================================================
// RATE LIMIT STATE
// =============================================================================

interface RateLimitState {
  remainingSecond: number | null;
  remainingMinute: number | null;
  reset: number | null;
  cost: number | null;
  lastRequest: number;
}

const state: RateLimitState = {
  remainingSecond: null,
  remainingMinute: null,
  reset: null,
  cost: null,
  lastRequest: 0,
};

/**
 * Update rate limit state from response headers
 */
function updateRateLimitState(headers: Headers): void {
  const remainingSecond = headers.get("x-ratelimit-remaining-stacks-second");
  const remainingMinute = headers.get("x-ratelimit-remaining-stacks-minute");
  const reset = headers.get("ratelimit-reset");
  const cost = headers.get("x-ratelimit-cost-stacks");

  state.remainingSecond = remainingSecond ? parseInt(remainingSecond, 10) : null;
  state.remainingMinute = remainingMinute ? parseInt(remainingMinute, 10) : null;
  state.reset = reset ? parseInt(reset, 10) : null;
  state.cost = cost ? parseInt(cost, 10) : null;
  state.lastRequest = Date.now();
}

/**
 * Calculate delay before next request based on rate limit state
 */
function calculateDelay(): number {
  // If we have no state, use conservative default
  if (state.remainingSecond === null && state.remainingMinute === null) {
    return DEFAULT_DELAY_MS;
  }

  // If per-second quota is exhausted, wait until next second
  if (state.remainingSecond !== null && state.remainingSecond <= 0) {
    const elapsed = Date.now() - state.lastRequest;
    return Math.max(0, 1000 - elapsed);
  }

  // If per-minute quota is low, slow down proportionally
  if (state.remainingMinute !== null && state.remainingMinute < 10) {
    // When minute quota is low, spread remaining requests across time
    // Lower quota = longer delay
    return SLOW_DELAY_MS + (10 - state.remainingMinute) * 100;
  }

  // Otherwise use minimal delay
  return MIN_DELAY_MS;
}

// =============================================================================
// REQUEST QUEUE
// =============================================================================

interface QueuedRequest {
  resolve: () => void;
}

class HiroRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;

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
      const delay = calculateDelay();
      if (delay > 0) {
        await sleep(delay);
      }

      const next = this.queue.shift();
      next?.resolve();
    }

    this.processing = false;
  }

  get length(): number {
    return this.queue.length;
  }
}

export const hiroQueue = new HiroRequestQueue();

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
  const { maxRetries = 3, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await hiroQueue.waitForTurn();

    try {
      const response = await fetch(url, fetchOptions);

      // Update rate limit state from headers
      updateRateLimitState(response.headers);

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
