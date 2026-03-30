# Transaction Data Flow Fixes - Phase Plan

**Quest Goal:** Implement all performance and correctness fixes identified in the audit quest.

**Priority Order:** Critical bugs first, then performance fixes, then enhancements.

---

## Phase 1: Fix Critical Bugs in Validation and Cycle Calculation

**Goal:** Fix the 3 bugs discovered during testing that could cause incorrect behavior or crashes.

**Key Changes:**
1. Fix null input validation in `isValidMiningTxArgs`, `isValidStackingTxArgs`, `isValidMiningClaimTxArgs`, `isValidStackingClaimTxArgs` - currently `typeof null === "object"` causes TypeError
2. Fix empty array validation in `isValidMiningTxArgs` - JS `[].every()` returns `true` for empty arrays, allowing invalid mining transactions
3. Fix `getCycleFirstBlock` startCycle offset bug - function ignores startCycle, causing incorrect cycle-to-block mapping for legacyV2/DAO versions where startCycle != 1

**Files Affected:**
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/transactions.ts` (null checks, empty array check)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/config/city-config.ts` (getCycleFirstBlock fix)

**Test Requirements:**
- Update `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/__tests__/transactions.test.ts`:
  - Change tests from "should throw on null" to "should return false on null"
  - Add test for empty amountsUstx array rejection
- Add tests to `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/__tests__/claims.test.ts`:
  - Test getCycleFirstBlock for legacyV2 with startCycle=17
  - Test getCycleFirstBlock for daoV2 with startCycle=54

**Dependencies:** None (foundational fix)

**Verification:**
```bash
npm test -- --run
# All 110 tests should pass
# Specifically verify:
# - isValidMiningTxArgs(null) === false (no throw)
# - isValidMiningTxArgs({functionName: "mine-tokens", amountsUstx: []}) === false
# - getCycleFirstBlock("mia", "legacyV2", 17) === 58921 (genesis)
```

---

## Phase 2: Memoize Decompression Atom

**Goal:** Eliminate 50ms+ per-read overhead at scale by memoizing the LZ-string decompression.

**Key Changes:**
1. Add memoization cache for decompressed transactions in `decompressedAcctTxsAtom`
2. Only decompress when compressed string changes (compare with cached value)
3. Return cached array reference when content unchanged

**Files Affected:**
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (lines 152-164)

**Test Requirements:**
- Add performance-related tests or manual verification
- Verify that multiple reads of `transactionsAtom` return same array reference
- Verify that writes trigger new decompression

**Dependencies:** None (independent optimization)

**Verification:**
```bash
# Manual verification in browser DevTools:
# 1. Load app with 1000+ transactions
# 2. Check that scrolling/re-renders don't cause decompression
# 3. Profile should show <1ms for subsequent atom reads
```

---

## Phase 3: Unify API Calls on hiroFetch

**Goal:** Replace fancyFetch with hiroFetch for transaction fetching to get 5-7x faster operations with proper rate limiting.

**Key Changes:**
1. Replace `fancyFetch` calls in `getAllTxs()` with `hiroFetch`
2. Remove the manual 1500ms sleep between pagination calls (hiroFetch queue handles this)
3. Update error handling to match hiroFetch result pattern
4. Consider removing or deprecating `fancyFetch` from common.ts

**Files Affected:**
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (lines 390-526)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/common.ts` (potentially remove fancyFetch)

**Test Requirements:**
- Manual testing with whale wallet (10k+ transactions)
- Verify transaction fetch completes faster
- Verify rate limits are properly respected (no 429 errors)

**Dependencies:** None (independent optimization)

**Verification:**
```bash
# Manual verification:
# 1. Connect wallet with 1000+ transactions
# 2. Time the transaction fetch
# 3. Expected: ~40% faster than before (1500ms -> ~200ms between calls)
# 4. No 429 errors in console
```

---

## Phase 4: Add localStorage Size Guards

**Goal:** Prevent localStorage quota exceeded errors with proactive size checking and user warnings.

**Key Changes:**
1. Add `getStorageSize()` utility to calculate current localStorage usage
2. Add `safeSetStorage()` wrapper that checks size before write
3. Add warning at 3MB usage threshold
4. Add graceful degradation at 4MB (offer to prune old data)
5. Update transaction save logic to use safe storage wrapper

**Files Affected:**
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (storage writes)
- New utility file or add to `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/storage.ts`

**Test Requirements:**
- Unit tests for storage size calculation
- Unit tests for safe storage wrapper behavior at thresholds
- Manual testing with simulated large data

**Dependencies:** Phase 2 (memoization should be in place to avoid re-decompression during size checks)

**Verification:**
```bash
npm test -- --run
# New storage utility tests pass

# Manual verification:
# 1. Simulate large transaction set approaching 3MB
# 2. Verify warning appears in console/UI
# 3. Verify graceful handling at 4MB+
```

---

## Phase 5: Batch Verification Cache Updates

**Goal:** Reduce O(n*k) complexity in batch verification to O(n+k) by collecting updates and applying once.

**Key Changes:**
1. In `verifyAllMiningAtom` and `verifyAllStackingAtom`, collect verification results in a local object
2. Apply all updates to cache in single `set()` call at end of batch
3. Still update progress atom per-entry for UI feedback
4. Keep individual "verifying" status updates for real-time feedback

**Files Affected:**
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/verification.ts` (lines 289-409, 508-623)

**Test Requirements:**
- Manual testing with 100+ unverified entries
- Verify progress UI still updates per-entry
- Verify final cache state is correct after batch

**Dependencies:** None (independent optimization)

**Verification:**
```bash
# Manual verification:
# 1. Have 100+ unverified mining entries
# 2. Click "Verify All"
# 3. Progress should update smoothly
# 4. After completion, all entries should have correct status
# 5. Profile should show reduced cache update overhead
```

---

## Phase 6: Add Cross-Tab Synchronization

**Goal:** Prevent stale state when user has multiple tabs open with same wallet.

**Key Changes:**
1. Create new `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/broadcast-sync.ts`:
   - Initialize BroadcastChannel for same-origin communication
   - Define message types: VERIFICATION_UPDATE, TRANSACTION_UPDATE, CLAIM_COMPLETED
   - Export hooks for listening and broadcasting
2. Update verification atoms to broadcast after cache updates
3. Update transaction atom to broadcast after fetch completion
4. Add listener in app initialization to merge incoming updates
5. Add visual indicator when tab is out of sync (optional)

**Files Affected:**
- New file: `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/broadcast-sync.ts`
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/verification.ts` (broadcast on cache update)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (broadcast on transaction update)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/components/layout/page-content.tsx` (initialize listener)

**Test Requirements:**
- Manual multi-tab testing:
  - Verify updates in Tab A appear in Tab B
  - Verify claim in Tab A shows as claimed in Tab B
  - Verify no infinite loops or message storms

**Dependencies:** Phase 5 (batched updates make sync messages more efficient)

**Verification:**
```bash
# Manual multi-tab verification:
# 1. Open app in Tab A and Tab B with same wallet
# 2. Verify an entry in Tab A
# 3. Tab B should show updated status within seconds
# 4. Claim in Tab A
# 5. Tab B should show claimed status after page focus
```

---

## Summary Matrix

| Phase | Focus | Risk | Impact | Estimated LOC |
|-------|-------|------|--------|---------------|
| 1 | Bug Fixes | Low | High (correctness) | ~30 |
| 2 | Decompression Memoization | Low | High (performance) | ~20 |
| 3 | Unify on hiroFetch | Medium | High (performance) | ~50 |
| 4 | Storage Guards | Low | Medium (reliability) | ~80 |
| 5 | Batch Cache Updates | Low | Medium (performance) | ~40 |
| 6 | Cross-Tab Sync | Medium | Medium (UX) | ~150 |

**Total Estimated Changes:** ~370 lines of code across 6 phases

---

## Execution Order Rationale

1. **Phase 1 first** - Bug fixes are highest priority; they affect correctness and must be fixed before any optimization work
2. **Phase 2 second** - Memoization is a foundational optimization that improves all subsequent work and testing
3. **Phase 3 third** - API unification is independent but significant; benefits from Phase 2 being complete for testing
4. **Phase 4 fourth** - Storage guards depend on Phase 2 (avoid re-decompression during size checks)
5. **Phase 5 fifth** - Batch updates are independent but make Phase 6 sync more efficient
6. **Phase 6 last** - Most complex change, builds on all prior optimizations being stable
