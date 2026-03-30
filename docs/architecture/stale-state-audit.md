# Stale State Audit

> Phase 4 of the State & Performance Quest
>
> **Goal:** Identify all scenarios where claims status can become stale or incorrect

## Executive Summary

The CityCoins claims system has **no automatic cache invalidation**. Verification results are cached indefinitely until manually cleared. This design prioritizes rate limit safety over freshness, but creates multiple staleness scenarios that users should understand.

### Key Findings

| Category | Staleness Risk | Current Mitigation |
|----------|---------------|-------------------|
| External Claims | HIGH | Transaction refresh on page load |
| Wallet Switching | MEDIUM | Cache keyed by address |
| Chain Reorgs | LOW | State priority system |
| Partial Fetches | MEDIUM | Progressive saves |
| Multi-Tab Usage | HIGH | None |
| Browser Refresh During Verification | MEDIUM | Progress persisted |

## State Persistence Architecture

### What Gets Cached

| Data | Storage Key | TTL | Keyed By |
|------|-------------|-----|----------|
| Transactions | `citycoins-stacks-acctTxs` | Infinite | Global (single wallet) |
| Verification Results | `citycoins-verification-cache-v2` | Infinite | Per-address |
| User IDs | `citycoins-user-ids` | Infinite | Global (single wallet) |
| Block Heights | `citycoins-stacks-blocks` | 30 seconds | Global |

**Code Reference:** `src/store/stacks.ts:26-77`, `src/store/verification.ts:113-137`

### State Priority System

When determining claim status, the system applies this priority order:

```
1. Transaction History (highest) - claimed/not-won from claim tx
2. Verification Cache (middle) - from manual verification
3. Base Status (lowest) - pending/unverified from timing
```

**Code Reference:** `src/store/claims.ts:415-441` (mining), `src/store/claims.ts:494-520` (stacking)

This priority system is the **primary staleness mitigation** - if a claim transaction appears in transaction history, it overrides any stale verification cache.

---

## Staleness Scenario Catalog

### Scenario 1: User Claims Reward in External Wallet

**Description:** User claims a mining/stacking reward using a different application (e.g., Stacks Explorer, direct contract call) while this app shows it as "claimable".

**How It Occurs:**
1. User verifies claims in CityCoins UI, cache shows "claimable"
2. User claims reward using external wallet/app
3. Returns to CityCoins UI - still shows "claimable"

**Current Behavior:**
- On page mount, transaction fetch is triggered (`page-content.tsx:24-34`)
- New claim transaction will be fetched and processed
- State priority system will detect the claim tx and mark as "claimed"

**Detection Time:** Next page load or manual transaction refresh

**Impact:** MEDIUM
- UI shows stale "Claim" button temporarily
- Attempting to claim again will fail at contract level (safe)
- User confusion until refresh

**Code Flow:**
```
page-content.tsx:24-34 (mount trigger)
  -> stacks.ts:174-200 (transactionsAtom write)
    -> stacks.ts:390-526 (getAllTxs)
      -> claims.ts:245-260 (claim tx detected)
        -> claims.ts:328-338 (status updated to "claimed")
```

**Mitigation Recommendation:**
1. Add explicit "Refresh" button with timestamp showing last update
2. Consider polling for new transactions every 60 seconds
3. Show "last verified at" timestamp on each entry

---

### Scenario 2: User Switches Wallets

**Description:** User disconnects wallet A and connects wallet B, potentially seeing mixed or stale data.

**How It Occurs:**
1. User connected as Wallet A, verifications cached under A's address
2. User clicks "Sign Out"
3. User connects Wallet B
4. Data display could show remnants of Wallet A

**Current Behavior:**
- Sign out calls `disconnect()` and `clearUserData()` (`sign-out.tsx:14-22`)
- `clearUserData` resets all localStorage atoms via `RESET` (`use-clear-user-data.tsx:12-26`)
- New wallet triggers fresh transaction fetch (`sign-in.tsx:18-19`)
- Verification cache is keyed by address (`verification.ts:121-137`)

**What Gets Cleared:**
```typescript
// Cleared on sign out:
- ccip016LocalStorageAtoms (5 atoms)
- commonLocalStorageAtoms (2 atoms)
- stacksLocalStorageAtoms (7 atoms)
// Including verificationCacheByAddressAtom
```

**Impact:** LOW (when following normal flow)
- Normal sign out -> sign in properly clears all state
- Verification cache per-address isolation works correctly

**Edge Case - Direct URL Access:**
If user bookmarks URL and accesses after wallet change:
- stxAddressAtom may persist in localStorage
- Page will show old address data until explicit sign in

**Mitigation Recommendation:**
1. Verify stxAddressAtom matches connected wallet on page load
2. Add wallet mismatch detection component

---

### Scenario 3: Long Pagination Fetch During Chain Reorg

**Description:** Transaction fetch spans multiple API calls while blockchain undergoes reorganization.

**How It Occurs:**
1. Large wallet (10k+ txs) requires 200+ API calls
2. At ~1.5s per call, fetch takes 5+ minutes
3. Chain reorg occurs mid-fetch
4. Some transactions may disappear or change status

**Current Behavior:**
- No reorg detection (`stacks.ts:390-526`)
- Transactions use `Map<tx_id, Transaction>` for deduplication
- First occurrence of each tx_id is kept, later duplicates ignored
- No cross-batch consistency check

**Potential Issues:**
1. Transaction fetched in batch N may be reorged before batch N+100
2. Block heights used for status calculation may be stale
3. No mechanism to detect or handle missing transactions

**Impact:** LOW
- Chain reorgs are rare on Stacks
- Most reorgs are shallow (1-2 blocks)
- Mining claims require 100 block maturity, far exceeding typical reorg depth

**Code Reference:** `stacks.ts:403-410` (deduplication), `stacks.ts:457-513` (pagination loop)

**Mitigation Recommendation:**
1. After large fetch, compare total count with API's reported total
2. Store fetch timestamp and warn if data is very old
3. For critical claims, re-verify single entry before claiming

---

### Scenario 4: Partial Fetch Failure

**Description:** Some pages of transaction pagination succeed while others fail.

**How It Occurs:**
1. Transaction fetch starts with page 0 (success)
2. Pages 1-5 succeed
3. Page 6 fails (rate limit, network error)
4. After 3 consecutive failures, fetch stops

**Current Behavior:**
- Progress saved every 500 transactions (`stacks.ts:490-492`)
- On error, saves current progress before stopping (`stacks.ts:498-506`)
- Uses exponential backoff: 5s, 10s, 20s (`stacks.ts:509`)
- Stops after 3 consecutive errors (`stacks.ts:500-501`)
- Error state shown to user (`stacks.ts:193-198`)

**Impact:** MEDIUM
- Partial data may show incomplete claims history
- Recent transactions more likely to be fetched (pagination from newest)
- User may not realize data is incomplete

**Code Reference:**
```typescript
// stacks.ts:498-512
if (consecutiveErrors >= maxConsecutiveErrors) {
  return getTransactions(); // Returns partial results
}
// Exponential backoff: 5000 * Math.pow(2, consecutiveErrors - 1)
```

**Mitigation Recommendation:**
1. Show clear indicator when fetch is incomplete
2. Store "last complete fetch" vs "partial fetch" status
3. Allow user to retry from last successful offset

---

### Scenario 5: Verification Cache Shows "Claimable" but Transaction History Shows "Claimed"

**Description:** Apparent contradiction between verification cache and transaction history.

**How It Occurs:**
1. User verifies block 12345 -> cache says "claimable"
2. User claims successfully
3. Claim transaction appears in history
4. Both cache (claimable) and history (claimed) exist

**Current Behavior:**
- State priority system handles this correctly
- Transaction history (Priority 1) overrides verification cache (Priority 2)
- Entry will show as "claimed"

**Impact:** NONE (by design)
- This is the intended behavior
- Priority system specifically designed for this case

**Code Reference:** `claims.ts:415-441`
```typescript
// If already claimed/not-won from transaction history, use that
if (entry.status === "claimed" || entry.status === "not-won") {
  return entry;
}
// ... then check verification cache
```

---

### Scenario 6: Browser Refresh During Verification Batch

**Description:** User refreshes page while "Verify All" is running.

**How It Occurs:**
1. User clicks "Verify All" on 100 mining entries
2. 30 entries verified, progress at 30%
3. User refreshes browser (intentional or accidental)
4. Verification stops mid-batch

**Current Behavior:**
- Verification progress atom is in-memory only (`verification.ts:142-149`)
- Each successful verification is saved to localStorage immediately
- 30 verified entries will persist in cache
- Remaining 70 stay "unverified"
- On reload, summary will show accurate counts

**Impact:** MEDIUM
- Lost progress is annoying but not destructive
- User must restart "Verify All" for remaining entries
- Already-verified entries are not re-verified (cache hit)

**Code Reference:** `verification.ts:342-346` (immediate save per entry)
```typescript
set(verificationCacheAtom, {
  ...currentCache,
  [key]: { status: "verifying", verifiedAt: Date.now() },
});
```

**Mitigation Recommendation:**
1. Show warning before navigating away during verification
2. Add "Resume Verification" that continues from last position
3. Consider persisting verification queue to localStorage

---

### Scenario 7: Two Browser Tabs with Same Wallet

**Description:** User opens CityCoins in multiple tabs with same connected wallet.

**How It Occurs:**
1. User opens Tab A, verifies claims
2. User opens Tab B, sees different verification state
3. User claims in Tab A
4. Tab B still shows "claimable"

**Current Behavior:**
- No cross-tab synchronization
- Each tab has independent Jotai store in memory
- localStorage is shared but not synchronized
- `atomWithStorage` uses localStorage but doesn't listen for storage events
- Tab B won't see Tab A's changes until refresh

**Impact:** HIGH
- User confusion
- Potential double-claim attempts (will fail at contract level)
- Wasted time and transaction fees

**Code Reference:** No synchronization code exists

**What's Missing:**
- `window.addEventListener('storage', ...)` for cross-tab sync
- `BroadcastChannel` for same-origin communication
- Any visibility change handlers

**Mitigation Recommendation:**
1. Add BroadcastChannel for verification cache sync:
```typescript
const channel = new BroadcastChannel('citycoins-sync');
channel.onmessage = (event) => {
  if (event.data.type === 'VERIFICATION_UPDATE') {
    // Merge new verification results
  }
};
```
2. Listen for localStorage `storage` events
3. Add "Tab out of sync" warning when discrepancy detected

---

### Scenario 8: Stale Block Height Used for Status Calculation

**Description:** Block height cache expires, causing incorrect pending/claimable status.

**How It Occurs:**
1. Block height fetched: 150,000
2. User mines block 150,001
3. 30+ seconds pass, block height cache expires
4. Status calculation uses stale height

**Current Behavior:**
- Block heights cached for 30 seconds (`stacks.ts:301`)
- `isMiningClaimEligible` uses cached block height
- Components fetch block heights on mount and address change

**Impact:** LOW
- 30 seconds is short enough that block height won't drift significantly
- Mining maturity is 100 blocks (~16 hours)
- Edge case affects very recently mined blocks only

**Code Reference:** `stacks.ts:300-366`
```typescript
const BLOCK_HEIGHT_CACHE_DURATION = 30 * 1000;
// Skip if cache is still fresh
if (status.lastFetched && now - status.lastFetched < BLOCK_HEIGHT_CACHE_DURATION) {
  return existingHeights;
}
```

**Mitigation Recommendation:**
1. Current 30s TTL is reasonable
2. Consider fetching fresh height before claim submission

---

### Scenario 9: User IDs Cached Indefinitely

**Description:** User IDs (required for stacking verification) are cached forever.

**How It Occurs:**
1. User's ID fetched from contract
2. Stored in `userIdsAtom` with no TTL
3. If contract state somehow changes, cache is stale

**Current Behavior:**
- User IDs fetched once and cached (`stacks.ts:105-146`)
- Skip if already cached: `if (existingIds) return;`
- No revalidation mechanism

**Impact:** VERY LOW
- User IDs are immutable once assigned
- Only changes if contract is upgraded (extremely rare)
- ID represents registration order, not a changeable attribute

**Code Reference:** `stacks.ts:113-117`
```typescript
const existingIds = get(userIdsAtom);
if (existingIds) {
  return; // Skip fetch if cached
}
```

**Mitigation Recommendation:**
1. Current behavior is appropriate for immutable data
2. Consider adding manual refresh option for advanced users

---

## Cache Invalidation Summary

### When Cache Is Invalidated

| Trigger | Transactions | Verification | User IDs | Block Heights |
|---------|-------------|--------------|----------|---------------|
| Clear Data Button | Yes | Yes | Yes | Yes |
| Sign Out | Yes | Yes | Yes | Yes |
| Page Refresh | Refetch (merge) | No | No | Refetch |
| Wallet Connect | Refetch (fresh) | No | No | Refetch |
| 30 seconds elapsed | No | No | No | Yes |
| Manual Refresh Button | Refetch (merge) | No | No | Yes |

### When Cache Should Be Invalidated (Recommendations)

1. **After successful claim transaction:** Clear verification cache for that specific entry
2. **On visibility change (tab focus):** Refetch block heights, optionally transactions
3. **On localStorage sync event:** Merge verification cache from other tabs
4. **Periodic background refresh:** Every 5 minutes for active users

---

## Risk Assessment Matrix

| Scenario | Likelihood | Impact | Risk Score | Priority |
|----------|------------|--------|------------|----------|
| External Claims | High | Medium | **High** | P1 |
| Multi-Tab Sync | High | High | **High** | P1 |
| Partial Fetch | Medium | Medium | **Medium** | P2 |
| Browser Refresh | Medium | Medium | **Medium** | P2 |
| Wallet Switching | Low | Low | **Low** | P3 |
| Chain Reorg | Very Low | Low | **Very Low** | P4 |
| Stale Block Height | Very Low | Very Low | **Very Low** | P4 |
| Cached User IDs | Very Low | None | **None** | N/A |

---

## Recommended Mitigations Summary

### Priority 1 (High Risk)

1. **Cross-tab synchronization** - Add BroadcastChannel or storage event listener
2. **Post-claim cache invalidation** - Clear verification cache entry after successful claim
3. **Explicit "last updated" indicator** - Show users when data was last fetched

### Priority 2 (Medium Risk)

4. **Partial fetch indicator** - Warn when transaction history is incomplete
5. **Navigation warning** - Prevent accidental refresh during verification
6. **Resume verification** - Allow continuing from where batch stopped

### Priority 3 (Low Risk)

7. **Wallet mismatch detection** - Verify connected wallet matches cached address
8. **Manual single-entry refresh** - Allow re-verifying individual claims

---

## Appendix: Code Reference Quick Links

| File | Lines | Description |
|------|-------|-------------|
| `src/store/stacks.ts` | 26-77 | LocalStorage atom definitions |
| `src/store/stacks.ts` | 105-146 | User ID fetching |
| `src/store/stacks.ts` | 152-200 | Transaction atom with decompression |
| `src/store/stacks.ts` | 300-366 | Block height caching |
| `src/store/stacks.ts` | 390-526 | Transaction pagination |
| `src/store/verification.ts` | 113-137 | Per-address verification cache |
| `src/store/verification.ts` | 196-284 | Single entry verification |
| `src/store/verification.ts` | 289-409 | Batch verification |
| `src/store/claims.ts` | 194-315 | Transaction processing |
| `src/store/claims.ts` | 415-441 | Mining entries with verification |
| `src/store/claims.ts` | 494-520 | Stacking entries with verification |
| `src/components/auth/sign-out.tsx` | 14-22 | Disconnect handling |
| `src/components/auth/sign-in.tsx` | 13-21 | Connect handling |
| `src/hooks/use-clear-user-data.tsx` | 10-30 | Data clearing logic |
| `src/components/layout/page-content.tsx` | 24-34 | Mount-time transaction refresh |
