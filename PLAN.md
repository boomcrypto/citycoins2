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
4. **Step C: Block/Cycle + Claim Validation Fixes**
   - Replace hard-coded math in `utilities/transactions.ts`.
   - Ensure readonly queries are accurate and exercised in `useCityHistory`.
4. **Step C: Block/Cycle + Claim Validation Fixes**
   - Replace hard-coded math in `utilities/transactions.ts`.
   - Ensure readonly queries are accurate and exercised in `useCityHistory`.
5. **Step D: Decoder and Error Handling Polish (remaining N2F)**
   - Address decoding resilience and claim verification fallbacks.
6. **Step E+: N2H Enhancements**
   - Apply polish items in priority order once N2F items are verified.

After each step:
- Run targeted tests (dev terminal).
- Document findings, outstanding issues, and next actions in this plan.

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
