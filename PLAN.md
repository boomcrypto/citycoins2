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
2. **Step A: Config Integration**
   - Sync `city-config.ts` with canonical data.
   - Refactor `utilities/contracts.ts` to consume the config.
   - Confirm filters/tabs still render with the refactored registry.
3. **Step B: User ID Cache Overhaul**
   - Update `userIdsAtom` schema.
  - Refactor `useCityHistory` to use the new schema and minimize fetches.
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