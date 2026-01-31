# Rate Limiting Audit

**Phase 3 Deliverable - January 2026**

This document analyzes the rate limiting implementations in citycoins-ui-v2, identifies bottlenecks, and provides recommendations for improvement.

## Executive Summary

The codebase uses **two different rate limiting strategies** that are not unified:

| Strategy | Used By | Approach | Retry Delay |
|----------|---------|----------|-------------|
| `fancyFetch` | Transaction fetching | Fixed retry, no headers | 5s fixed |
| `hiroFetch` | Contract reads, verification | Header-aware queue | Dynamic (50ms-2000ms) |

**Key Finding:** Transaction fetching uses the less sophisticated strategy while verification (which can make many more calls) uses the smarter one. This is backward - the high-volume operation should use the smarter strategy.

## API Call Site Inventory

### 1. Transaction Fetching (`src/store/stacks.ts`)

**Strategy:** `fancyFetch` with manual 1500ms sleep between pagination calls

| Location | Line | Endpoint | Frequency |
|----------|------|----------|-----------|
| `getAllTxs()` | 423 | `/extended/v1/address/{address}/transactions` | Initial fetch |
| `getAllTxs()` loop | 463 | Same endpoint with offset | N/50 times (paginated) |
| `getBlockHeights()` | 374 | `/v2/info` | On mount, 30s cache |

**Worst Case Analysis:**
- 100 txs: 2 API calls (initial + 1 page)
- 1,000 txs: 20 API calls over ~30 seconds
- 10,000 txs: 200 API calls over ~5 minutes
- 100,000 txs: 2,000 API calls over ~50 minutes

**Rate Limit Handling:**
```
src/store/stacks.ts:458-512
- 1500ms fixed sleep between pagination requests
- On 429: 5s fixed retry (from fancyFetch)
- Exponential backoff: 5s, 10s, 20s on consecutive errors
- Max 3 consecutive errors before giving up
```

### 2. Contract Reads (`src/utilities/hiro-client.ts`)

**Strategy:** `hiroFetch` with header-aware queue

All contract reads go through the unified `hiroFetch` -> `callReadOnlyFunction` path:

| File | Function | Contract Call | When Called |
|------|----------|---------------|-------------|
| `legacy-mining.ts:44` | `canClaimMiningReward()` | `can-claim-mining-reward` | Mining verification |
| `legacy-mining.ts:109` | `isBlockWinner()` | `is-block-winner` | Mining verification (fallback) |
| `legacy-stacking.ts:59` | `getStackingReward()` | `get-stacking-reward` | Stacking verification |
| `legacy-user-registry.ts:65` | `getUserId()` | `get-user-id` | User ID lookup (4x) |
| `dao-mining.ts:70` | `isBlockWinner()` | `is-block-winner` | Mining verification |
| `dao-mining.ts:157` | `getMiningStats()` | `get-mining-stats-at-block` | (unused currently) |
| `dao-stacking.ts:58` | `getStackingReward()` | `get-stacking-reward` | Stacking verification |
| `dao-stacking.ts:133` | `getStacker()` | `get-stacker` | (unused currently) |
| `dao-stacking.ts:210` | `isCyclePaid()` | `is-cycle-paid` | (unused currently) |
| `dao-stacking.ts:255` | `getCurrentRewardCycle()` | `get-current-reward-cycle` | (unused currently) |
| `dao-user-registry.ts:50` | `getUserId()` | `get-user-id` | User ID lookup (1x) |

**Rate Limit Handling:**
```
src/utilities/hiro-client.ts:77-99
- Dynamic delay based on remaining quota headers
- Default: 200ms between requests
- When per-second exhausted: wait up to 1000ms
- When per-minute < 10: 500ms + (10 - remaining) * 100ms
- Cap at 2000ms max delay
- On 429: respects Retry-After header or exponential backoff
```

### 3. User ID Fetching (`src/utilities/claim-verification.ts`)

**Strategy:** Parallel `Promise.all` through `hiroFetch` queue

```
src/utilities/claim-verification.ts:259-265
- Fetches 5 user IDs in parallel:
  - miaV1, miaV2, nycV1, nycV2 (legacy API)
  - dao (protocol API)
- All go through hiroFetch queue
- Queue handles spacing between requests
```

**Calls per wallet connect:** 5 contract reads

## Rate Limiting Strategy Comparison

### `fancyFetch` (src/store/common.ts:94-119)

```typescript
// Simplified logic:
async function fancyFetch(url, retries = 3) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error();
    return response.json();
  } catch (error) {
    if (attempts < retries) {
      await sleep(5000);  // Fixed 5s retry
      return fancyFetch(url, retries, attempts + 1);
    }
    throw error;
  }
}
```

**Characteristics:**
- No rate limit header awareness
- Fixed 5000ms retry delay on any error
- No request queuing
- Caller must manually add delays (1500ms in `getAllTxs`)

### `hiroFetch` (src/utilities/hiro-client.ts)

```typescript
// Simplified logic:
class HiroRequestQueue {
  async waitForTurn() {
    // Queue requests, process sequentially
    const delay = calculateDelay();  // Based on headers
    await sleep(delay);
  }
}

async function hiroFetch(url, options) {
  await hiroQueue.waitForTurn();
  const response = await fetch(url);
  updateRateLimitState(response.headers);

  if (response.status === 429) {
    const retryAfter = parseRetryAfter(headers);
    await sleep(retryAfter || exponentialBackoff);
    // retry...
  }
}
```

**Characteristics:**
- Reads `x-ratelimit-remaining-stacks-second`, `x-ratelimit-remaining-stacks-minute`
- Dynamic delay calculation based on remaining quota
- Global request queue (singleton)
- Respects `Retry-After` header on 429
- Exponential backoff on network errors

## Bottleneck Analysis

### Bottleneck 1: Transaction Pagination Delay

**Location:** `src/store/stacks.ts:458`

**Issue:** Fixed 1500ms delay between pagination requests is arbitrary and potentially suboptimal.

**Impact Calculation:**
| Wallet Size | API Calls | Total Delay Time | With Header-Aware |
|-------------|-----------|------------------|-------------------|
| 100 txs | 2 | 1.5s | ~0.2s |
| 1,000 txs | 20 | 28.5s | ~4s |
| 10,000 txs | 200 | 298.5s (5 min) | ~40s |

The 1500ms delay was likely chosen to be "safe" but Hiro's actual rate limits allow much faster:
- Per-second limit is typically 50-100 requests
- Current approach wastes ~1.3s per request

**Recommendation:** Migrate transaction fetching to use `hiroFetch` queue.

### Bottleneck 2: Sequential Verification

**Location:** `src/store/verification.ts:325-397` (mining), `548-621` (stacking)

**Issue:** Verification processes entries one-by-one in a loop.

```typescript
// src/store/verification.ts:325
for (let i = 0; i < unverified.length; i++) {
  const entry = unverified[i];
  // ... verify single entry
}
```

**Impact:**
- Mining verification: 1-2 API calls per entry
- Stacking verification: 1 API call per entry

**Worst Case Calculation (Mining):**
| Unverified Entries | API Calls | Time with hiroFetch |
|-------------------|-----------|---------------------|
| 10 | 10-20 | ~2-4s |
| 100 | 100-200 | ~20-40s |
| 1,000 | 1,000-2,000 | 3-7 minutes |

**Recommendation:** The sequential approach is actually appropriate here because:
1. The `hiroFetch` queue already handles request spacing
2. Batching would require contract changes (read-only calls can't be batched in Clarity)
3. User can see progress during verification

### Bottleneck 3: User ID Fetch on Wallet Connect

**Location:** `src/utilities/claim-verification.ts:253-291`

**Issue:** 5 parallel requests on every wallet connect (if not cached).

**Actual Impact:** Low - only happens once per wallet, cached indefinitely.

**Recommendation:** Already optimal (parallel fetch through queue).

### Bottleneck 4: Inconsistent Error Recovery

**Issue:** `fancyFetch` and `hiroFetch` have different retry behaviors.

| Scenario | fancyFetch | hiroFetch |
|----------|------------|-----------|
| 429 Rate Limit | 5s fixed | Retry-After header or 2s, 4s, 8s |
| Network Error | 5s fixed | 1s, 2s, 4s exponential |
| Max Retries | 3 | 3 |

**Risk:** Transaction fetching may hammer the API after 429 with only 5s delay, while the actual cooldown could be longer.

## Hiro API Rate Limits Reference

Based on header analysis, Hiro's API enforces:

| Limit Type | Value | Header |
|------------|-------|--------|
| Per-second | ~50 requests | `x-ratelimit-remaining-stacks-second` |
| Per-minute | ~500 requests | `x-ratelimit-remaining-stacks-minute` |
| Request cost | 1 (simple) to 5+ (complex) | `x-ratelimit-cost-stacks` |

The `/extended/v1/address/{address}/transactions` endpoint is a higher-cost endpoint due to the data it returns.

## Recommendations

### Priority 1: Unify on `hiroFetch` for All API Calls

**Change:** Refactor transaction fetching to use `hiroFetch` instead of `fancyFetch`.

**Benefits:**
- Header-aware delays instead of fixed 1500ms
- Proper 429 handling with Retry-After
- Single request queue for all Hiro API calls
- Estimated 5-7x speedup for large wallet fetches

**Implementation Notes:**
- Remove sleep(1500) from getAllTxs loop
- Replace fancyFetch calls with hiroFetch
- hiroFetch queue will handle spacing

### Priority 2: Remove or Repurpose `fancyFetch`

**Current Usage:** Only transaction fetching uses `fancyFetch`.

**Options:**
1. Delete `fancyFetch` after migration (preferred)
2. Keep for non-Hiro endpoints (none currently exist)

### Priority 3: Add Request Cost Awareness

**Enhancement:** Track `x-ratelimit-cost-stacks` header to predict quota usage.

The transaction endpoint likely costs more than read-only contract calls. Tracking this would allow:
- More accurate delay calculations
- Better progress estimates for users

### Priority 4: Consider Request Batching for Future

**Not Currently Possible:** Clarity read-only calls cannot be batched at the API level.

**Future Consideration:** If many verifications are needed, consider:
- A backend service that batches and caches results
- Or accepting the sequential limitation with better UX (background processing)

## Verification Call Analysis

### Mining Verification Flow

```
verifyMiningClaim() [src/utilities/claim-verification.ts:55-152]
  |
  +-- Legacy Version:
  |     |
  |     +-- canClaimMiningReward() -> 1 contract read
  |     |     Returns true? -> Done (1 call)
  |     |     Returns false? -> Continue
  |     |
  |     +-- isBlockWinner() -> 1 contract read
  |           Returns winner status (total: 2 calls if can't claim)
  |
  +-- DAO Version:
        |
        +-- isBlockWinner() -> 1 contract read
              Returns { isWinner, isClaimed, canClaim }
              (total: 1 call always)
```

**Calls per mining entry:**
- Legacy (can claim): 1
- Legacy (can't claim): 2
- DAO: 1

### Stacking Verification Flow

```
verifyStackingClaim() [src/utilities/claim-verification.ts:171-226]
  |
  +-- Legacy Version:
  |     +-- getStackingReward() -> 1 contract read
  |
  +-- DAO Version:
        +-- getStackingReward() -> 1 contract read
```

**Calls per stacking entry:** 1 (both versions)

## Appendix: Call Volume Estimates

### Scenario: First-time User with Active Mining History

Assumptions:
- 500 transactions total
- 50 mining entries across versions
- 20 stacking entries across versions

| Operation | API Calls | Strategy | Time Estimate |
|-----------|-----------|----------|---------------|
| Fetch transactions | 10 | fancyFetch | ~15s |
| Fetch user IDs | 5 | hiroFetch | ~1s |
| Verify all mining | 50-100 | hiroFetch | ~10-20s |
| Verify all stacking | 20 | hiroFetch | ~4s |
| **Total** | **85-135** | Mixed | **~30-40s** |

With unified `hiroFetch`:
- Transaction fetch: ~2s (vs 15s)
- **New Total:** ~17-27s (45% improvement)

### Scenario: Whale Wallet

Assumptions:
- 10,000 transactions
- 500 mining entries
- 200 stacking entries

| Operation | API Calls | Current Time | With Unified |
|-----------|-----------|--------------|--------------|
| Fetch transactions | 200 | ~5 min | ~40s |
| Verify all mining | 500-1000 | ~2-3 min | Same |
| Verify all stacking | 200 | ~40s | Same |
| **Total** | **900-1400** | **~8 min** | **~4 min** |

## Code References

| File | Line(s) | Purpose |
|------|---------|---------|
| `src/store/common.ts` | 82-119 | `sleep()` and `fancyFetch()` implementations |
| `src/store/stacks.ts` | 390-526 | `getAllTxs()` transaction fetching |
| `src/store/stacks.ts` | 372-388 | `getBlockHeights()` |
| `src/utilities/hiro-client.ts` | 62-99 | Rate limit state and delay calculation |
| `src/utilities/hiro-client.ts` | 109-160 | `HiroRequestQueue` class |
| `src/utilities/hiro-client.ts` | 226-285 | `hiroFetch()` function |
| `src/utilities/hiro-client.ts` | 319-375 | `callReadOnlyFunction()` |
| `src/store/verification.ts` | 325-397 | `verifyAllMiningAtom` sequential loop |
| `src/store/verification.ts` | 548-621 | `verifyAllStackingAtom` sequential loop |
| `src/utilities/claim-verification.ts` | 253-291 | `fetchAllUserIds()` parallel fetch |

## Conclusion

The primary bottleneck is the **dual rate limiting strategy** where the higher-volume operation (transaction fetching) uses the less sophisticated approach. Unifying on `hiroFetch` for all Hiro API calls would:

1. Reduce transaction fetch time by 5-7x for large wallets
2. Eliminate arbitrary 1500ms delays
3. Properly respect Hiro's rate limit headers
4. Provide consistent error recovery across all API calls

The verification system is already well-designed with the `hiroFetch` queue, and its sequential nature is appropriate given the constraints of Clarity read-only calls.
