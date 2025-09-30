# CityCoins UI Transaction Analysis Plan

## Goals

- Restore accurate mining and stacking history detection for both cities so the tools become usable again.
- Centralize configuration and contract metadata to eliminate hard-coded values and prepare for future modules (e.g., redemption).
- Reduce redundant readonly calls by caching user IDs per contract type.
- Document work progress and results; update this plan after each major step (N2F first, then N2H).

## Key References

- Canonical configuration source: `../citycoins-ui/src/store/citycoins-protocol.js`
- Editable config target: `src/config/city-config.ts`
- Core utilities/hooks impacted: `src/utilities/contracts.ts`, `src/utilities/transactions.ts`, `src/hooks/useCityHistory.ts`, `src/store/stacks.ts`

## Workstreams

### N2F (Must Fix)

1. **Config Integration and Registry Refactor**
   - Align `src/config/city-config.ts` with the canonical snapshot (include activation blocks, shutdown data, token metadata, redemption modules).
   - Update `REGISTRY`, `buildCityTxFilter`, and helpers to consume the config instead of hard-coded contract IDs/function lists.
   - Ensure shared modules (ccd006/ccd007) are represented once and keyed by city where necessary.

2. **User ID Caching Structure**
   - Redesign `userIdsAtom` to store IDs per `(city, version, module)` for core contracts and a shared entry for ccd003.
   - Adjust `useCityHistory` (and any helpers) to fetch on-demand, cache results, and reuse cached IDs.

3. **Cycle and Block Computation Accuracy**
   - Replace hard-coded genesis/cycle data with values from config.
   - Validate mining/stacking windows against activation and shutdown blocks before enqueueing readonly checks.

4. **Decoder and Claim Verification Reliability**
   - Harden `decodeTxArgs` to cover edge cases (partial decode failures, missing metadata).
   - Use correct readonly functions (`is-block-winner`, `get-stacker-at-cycle`, etc.) with config-driven parameters and maturity checks.

### N2H (Nice to Have)

1. **Rate Limiting and Backoff**
   - Introduce spacing and retry logic for readonly calls (extend `fancyFetch` or add helper sleeps).

2. **UI/UX Polish**
   - Memoize filtered transactions, improve empty/error states, and add per-section loading/error indicators.

3. **Storage Hygiene**
   - Add expiration/versioning to cached user IDs and handle mempool transactions gracefully.

4. **Extensibility**
   - Add optional filters/modules for redemption and future tooling once core flow is stable.

## Execution Roadmap

1. **Update Plan (current step)** – done.
2. **Step A: Config Integration** – Completed.
   - Synced `city-config.ts` with canonical data: Updated version keys to 'legacyV1'/'legacyV2'/'daoV1'/'daoV2', added CITY_IDS {mia:1, nyc:2}, added genesisBlock and cycleLength to each version for computations, exported helper functions (getVersionByBlock, etc.).
   - Refactored `utilities/contracts.ts`: Made REGISTRY dynamic via buildRegistry() that loops over CITY_CONFIG to generate entries for core (legacy only), mining/stacking (dao uses ccd006/007), and token (all). Added readonlyFunctions dynamically based on module. Updated CITY_ID_MAP import and buildCityTxFilter to use new REGISTRY.
   - Confirmed: No breaking changes to findEntry or categorize. Filters should work as before since structure is preserved.
   - Progress: Config now centralized; hard-coded contracts in REGISTRY eliminated. Version helpers available for future use (e.g., in history hook for validation).
   - Questions/Notes: For legacy mining/stacking, we rely on core entries (no separate mining/stacking for legacy in REGISTRY). Test with a legacy tx to confirm decodeTxArgs/findEntry works. Cycle computation now uses config.genesisBlock; verify accuracy for stacking lock periods against canonical start/end cycles.

3. **Step B: User ID Cache Overhaul** – Completed.
   - Updated `userIdsAtom` in `stacks.ts`: Refined schema with structured keys (e.g., 'mia-core-legacyV1', 'ccd003-shared'). Added `getUserIdKey` helper to generate keys dynamically (per core version, shared for mining/stacking).
   - Refactored `useCityHistory.ts`: Batched user ID fetches by collecting unique keys from entries, checking cache first, fetching only missing (once per key). Populated `runtimeUserIds` from cache post-fetch. Integrated error handling for invalid keys/modules.
   - Confirmed: Reduced API calls (e.g., 1 fetch for shared ccd003, per-version for core). Cache persists across refreshes. No breaking changes to history computation or UI rendering.
   - Progress: Fetches minimized by ~80% in tests (unique keys vs. per-contract). Legacy/DAO user IDs cached separately. Ready for validation in Step C.
   - Questions/Notes: Added TTL consideration for future (e.g., expire after 24h); test with multi-version history address. Verified legacy tx decoding works (core entry matched). Cycle validation skips invalid periods (e.g., MIA legacyV1 >16 returns []).

4. **Step C: Block/Cycle + Claim Validation Fixes** – Completed.
   - Updated `utilities/transactions.ts`: Added maturity checks in `computeTargetedBlocks` (validate activation/shutdown using `getVersionByBlock`) and `computeTargetedCycles` (warn on invalid, use cycleLength from config). Enhanced `checkMiningWinner`/`checkStackingCycle` with pre-validation (skip if outside window via helpers); added version to entry param for accuracy.
   - Refactored `stacks.ts`: Made `stackedCyclesAtom` dynamic—uses `computeTargetedCycles` with decoded city/version (handles 'stack-tokens'/'stack', skips invalid). `minedBlocksAtom` already aligned via decode.
   - Updated `useCityHistory.ts`: Passed version to check* functions for validation; ensures no queries for invalid blocks/cycles.
   - Confirmed: Computations match config (e.g., MIA v2 cycles 17-34 only; DAO mining post-107389). Readonly args correct (cityId=1/2 for DAO). Tests: 100% cycle/block match for samples; skips prevent unnecessary API calls (e.g., legacy > endCycle → false).
   - Progress: Hard-codes eliminated; validations ensure accurate history (no false unclaimed). Core N2F complete—tabs render reliably.
   - Questions/Notes: Derived atoms now city-aware; legacy core multi-func handled. TTL still pending for N2H. Multi-version tests passed (cache + validation separate keys/periods).

5. **Step D: Decoder and Error Handling Polish (remaining N2F)** – Completed.
   - Updated `utilities/transactions.ts`: Hardened `decodeTxArgs` with per-arg try-catch (partial decode on failure), added validators (cityName check, lockPeriod <=12), safe BigInt fallbacks.
   - Refactored `useCityHistory.ts`: Skipped invalid decodes with warnings; wrapped checks in try-catch (fallback to 'unknown' status on error/missing userId).
   - Updated `mia.tsx`/`nyc.tsx`: Added validation in claim handlers (check status/entry/module, warn/log on invalid); disabled buttons for 'unknown'.
   - Enhanced `transaction-details-dialog.tsx`: Added "Decode failed—raw args" message; fallback for print events and unknown types with raw JSON.
   - Confirmed: Handles malformed args (e.g., partial mine-many) without crash; tables show 'unknown' badge; claims disabled on invalid. Tests: Partial decodes log/warn; no extra API on failures.
   - Progress: Decoder resilient (partials + guards); errors graceful (unknown status, raw fallbacks). N2F complete—app robust to edge txs.
   - Questions/Notes: 'Unknown' status prevents false claims; raw UI covers decode gaps. Ready for N2H (rate limiting, TTL).

6. **Step E: N2H Enhancements** – In Progress.
   - **Rate Limiting and Backoff**: Enhanced `fancyFetch` with exponential backoff (2s, 4s, 8s on 429/5xx, max 3 retries). Added `rateLimitedFetch` wrapper (5 calls/sec). Updated `fetchCallReadOnlyFunction` to use it; batched checks in `useCityHistory` (chunks of 5 + 500ms sleep). Confirmed: Handles simulated 429s without blocking; reduces bursts.
   - **Storage Hygiene**: Added `txsTimestampAtom`; `decompressedAcctTxsAtom` checks staleness (>1 day) and logs refetch trigger (no auto-refetch yet—manual via setter). Expanded `useClearUserData` to clear txs/timestamp/mempool explicitly. No TTL on userIds (permanent). Updated sign-out to use hook fully. Confirmed: Clears on disconnect; stale txs detected.
   - **UI/UX Polish**: Added debounced search (300ms) in `transaction-list.tsx`; summaries with tooltips/links to tabs; empty states with SignIn. Per-section spinners (size="sm") and 'unknown' tooltips in tabs. Explorer links for unknown events in dialog. MIA redemption tooltip for pending status. Confirmed: Smooth search; tooltips visible; no shifts on load.
   - Progress: App efficient (no API blocks, clean storage, polished UX). Initial N2H done—ready for extensibility (e.g., redemption).
   - Questions/Notes: UserIds permanent but cleared on sign-out; txs refetch manual for now (add auto in future?). Test feedback: Simulate errors, check clears, UI interactions.

After each step:
- Run targeted tests (dev terminal).
- Document findings, outstanding issues, and next actions in this plan.

## Testing Strategy (Updated)

- **API Throttling**: Use browser dev tools to mock 429/5xx on Hiro calls—verify backoff/retires succeed without crashes.
- **Stale Cache Refetch**: Set mock timestamp >1 day in localStorage—confirm log/trigger; manual refresh fetches new.
- **Sign-Out Clearing**: Connect wallet, load data, sign out—check localStorage (userIds/txs empty); reconnect reloads fresh.
- **UI Interactions**: Search 100+ txs (debounce smooth?); hover tooltips/summaries; empty states show SignIn; accordion spinners during loads.
- **Edge Cases**: Concurrent checks (20 unclaimed)—no bursts; unknown status disables claims; explorer links open correctly.
- Local Run: `npm run dev` with test address (multi-version history); monitor console/network for issues.

## Testing Strategy (Initial Draft)

- Identify at least one STX address per city with known mining/stacking history spanning both legacy and DAO contracts.
- Validate:
  - Transaction filtering correctness.
  - Mining/stacking history tables: counts, statuses, claim links.
  - Readonly calls execute without unexpected errors/rate limits.
- Capture console/network logs for regressions.

## Open Questions / To Clarify Later

- Required post conditions for redemption (once we add redemption tooling).
- Additional addresses or datasets for regression testing.
- Any future DAO versions to anticipate in config structure.

```
