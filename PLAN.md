# CityCoins UI Transaction Analysis Plan

## Updated Plan for Fixing Transaction Loading, Analysis, and Action Handling

Thank you for providing the `cities.js` file—it's a valuable reference that aligns well with our modular goals. It contains structured `CITY_CONFIG` data (e.g., activation blocks, contract names/addresses per city/version, token details) and `CITY_INFO` (UI-specific like logos, versions). This directly addresses gaps in dynamic configuration (e.g., genesis blocks for cycle computation, contract resolution). We'll integrate it by extracting/exporting `CITY_CONFIG` into `contracts.ts` (or a new `config.ts`) for reuse across utilities/hooks, making the system more modular. For example:
- Use `CITY_CONFIG[city][version].core.name` to dynamically resolve contract IDs in `buildCityTxFilter` and `findEntry`.
- Pull activation blocks (e.g., MIA v1: 13456, NYC v1: 24497) for `computeTargetedCycles`.
- Extend for new filters (e.g., add `redemption` module to `CITY_CONFIG` with ccd012/013 contracts/functions like `redeem-mia`/`redeem-nyc`).

This keeps things simple: One config source for all cities/versions, easy to add new modules (e.g., redemption) without hardcoding. For UI modularity, we'll update `buildCityTxFilter` to optionally include new categories (e.g., pass `includeRedemption: true`), and components like `Mia`/`Nyc` can render new accordions/tables similarly to mining/stacking (e.g., detect redemption txs in `filteredTransactions` and add a "Redemption History" section). Focus remains on mining/stacking for now—redemption can be a quick N2H extension later.

The provided info sharpens our axe by:
- **Enabling modularity**: `CITY_CONFIG` replaces hardcoded values (e.g., genesis blocks), making multi-city/version support trivial without duplication.
- **Simplifying storage/user IDs**: Aligns with your suggested structure (e.g., `{ v1: { mia: 1, nyc: 3 }, v2: { mia: 3, nyc: 6 }, ccd003: 12 }`—we'll use this for `userIdsAtom` to cache per-version/city/shared).
- **Reducing fetches**: Confirms core contracts are isolated (need per-contract userId calls), but shared (ccd006/007) use ccd003—fetch only once per type, cache in structured atom. No direct principal support in shared (they require userId), so minimal fetches.
- **Historical focus**: Drops maturity/cycle completion checks (all claims are "find unclaimed funds" now), simplifying verification to just "is winner/stacked?" via readonly calls.
- **API discipline**: Reinforces spacing (500-1000ms sleeps in loops, 30s backoff on 429)—no bursting, even for history checks. Use `fancyFetch` wrapper for retries.
- **Prioritization**: Shifts perf/UX to N2H; core accuracy (contracts, computations, userIds) to N2F for quick wins.

No action yet—this updated plan refines the previous one for simplicity and focus. Estimated dev time: 3-5 hours (N2F first, then N2H). We'll implement in small commits, testing with a sample address having mixed v1/v2 txs.

### Updated High-Level Overview
The flow remains: Fetch/store txs → Filter by city → Decode/compute potentials (using `CITY_CONFIG`) → Fetch/cache userIds (structured atom, only if needed) → Verify unclaimed (spaced readonly calls, no maturity checks) → Display history with claim buttons. Modularity via `CITY_CONFIG` and extensible REGISTRY (e.g., add redemption as new module). LocalStorage for txs/userIds follows the same atom pattern (compress if large). API calls spaced with sleeps/backoff. Output: Accurate "find unclaimed funds" for mining/stacking, easy to extend for redemption/votes/etc.

### Specific Issues, Categorized (N2F vs N2H)
**N2F (Need to Fix – Core Accuracy, ~2-3 hours)**: These block correct history detection; fix first for functional mining/stacking.
1. **Contract Registry and Filtering**: REGISTRY duplicates shared contracts; `buildCityTxFilter` inefficient. Integrate `CITY_CONFIG` for dynamic resolution (e.g., no hardcodes). Add redemption module for future-proofing (but don't implement UI yet).
2. **User ID Resolution**: Core needs per-contract fetches (not ccd003); shared needs single ccd003 fetch. Cache in structured `userIdsAtom` (e.g., `{ v1: { mia: 1n, nyc: 3n }, v2: { mia: 3n, nyc: 6n }, ccd003: 12n }`). Fetch only for contracts with txs (pre-fetch in hook loop).
3. **Block/Cycle Computation**: Hardcoded NYC values break MIA; use `CITY_CONFIG[city][version]` for genesis/cycleLength. Validate post-activation only.
4. **Decoding**: Partial failures silent; add try-catch per arg. Ensure city/version from `CITY_CONFIG` if decode misses it.
5. **Claim Verification**: Use `is-block-winner`/`get-stacker` correctly, but skip maturity (historical). Match claimed txs exactly by block/cycle/contract.

**N2H (Nice to Have – Perf/UX Polish, ~1-2 hours)**: These improve reliability but aren't blockers; defer if time-constrained.
1. **API Spacing/Backoff**: Add 500-1000ms sleep in `getAllTxs` loop and history checks (e.g., `await sleep(750)` between readonly calls). On 429, backoff 30s and retry (wrap `fancyFetch` with exponential backoff).
2. **Component UX**: Memoize `filteredTransactions`; add errors/spinners in tables. Enable claim buttons only for verified unclaimed (already in status). For redemption, dynamic postConditions (fetch balances).
3. **Storage/Offline**: Version `userIdsAtom` data (e.g., TTL=1hr via timestamp). Handle mempool txs in atoms (but low priority).
4. **Modularity for New Filters**: Extend REGISTRY/filters for redemption (e.g., `buildCityTxFilter(city, { includeRedemption: true })`); add accordion in Mia/Nyc like mining (but skip impl now).
5. **Edge Cases**: Dedupe multi-version txs; warn on failed decodes/userIds. Test with mixed tx history.

### Updated General, List-Style Instructions for Fixes
Follow sequentially; test after each (e.g., load page, check console for fetches, verify history tables). Use `CITY_CONFIG` from cities.js as base (copy to `src/config/city-config.ts`). Simple: No new libs (e.g., no p-limit), just `sleep` and `Promise.allSettled`. Structured userIds as you suggested (per-version/city for core, single for ccd003).

1. **Integrate Config (N2F, 15-30min)**:
   - Files: `src/config/city-config.ts` (new), `src/utilities/contracts.ts`.
   - Create `src/config/city-config.ts`: Export `CITY_CONFIG` and `CITY_INFO` from cities.js (add redemption module: `{ mia: { contract: 'SP8A9...ccd012-redemption-mia', functions: ['redeem-mia'] }, nyc: { ... ccd013 } }`).
   - In `contracts.ts`: Import `CITY_CONFIG`; update REGISTRY to reference dynamically (e.g., `contract: CITY_CONFIG[city][version][module].contract`). Dedupe shared (one entry with `city: 'shared'`). Update `buildCityTxFilter(city)` to pull from config + include shared if needed.

2. **Fix User ID Handling (N2F, 30-45min)**:
   - Files: `src/store/stacks.ts`, `src/utilities/transactions.ts`, `src/hooks/useCityHistory.ts`.
   - In `stacks.ts`: Update `userIdsAtom` to structured object (e.g., `{ v1: { mia: null, nyc: null }, v2: { mia: null, nyc: null }, ccd003: null }` – use `bigint | null`).
   - In `transactions.ts`: Modify `getUserId(principal, contractId?)` – if contractId (core), call that contract's `get-user-id`; else ccd003. Cache via setAtom in caller.
   - In `useCityHistory.ts`: Before checks, loop unique contracts → determine type (core/shared via config) → fetch/cache userId only if null (e.g., `if (!userIds[type]) await fetchAndSet`). Use single ccd003 fetch for all shared.

3. **Update Computations (N2F, 20-30min)**:
   - Files: `src/utilities/transactions.ts`, `src/hooks/useCityHistory.ts`.
   - In `transactions.ts`: `computeTargetedCycles(tx, decoded, city, version)` – use `CITY_CONFIG[city][version].activationBlock` for genesis, `.rewardCycleLength` (2100). Filter cycles/blocks >= activation.
   - In `useCityHistory.ts`: Pass city/version from decoded/entry to compute (infer from config if missing).

4. **Simplify Verification (N2F, 30min)**:
   - Files: `src/hooks/useCityHistory.ts`, `src/utilities/transactions.ts`.
   - In `useCityHistory.ts`: For mining, use `checkMiningWinner` with just `is-block-winner` (no maturity). For stacking, `checkStackingCycle` with `amount > 0` (no completion check). Space checks: `for await (const check of toCheckMining) { await check; await sleep(750); }` (sequential for safety).
   - Match claimed: Group by contract/block or cycle; add to history if winner/stacked.
   - In `transactions.ts`: Ensure `checkMiningWinner`/`checkStackingCycle` use config for function names (e.g., core vs shared).

5. **API Spacing and Backoff (N2H, 20-30min)**:
   - Files: `src/store/stacks.ts`, `src/hooks/useCityHistory.ts`, `src/store/common.ts` (for fancyFetch).
   - In `stacks.ts`: `getAllTxs` – after each fetch, `await sleep(750)` (bump from 500ms). On error, if 429, `await sleep(30000); retry once`.
   - In `useCityHistory.ts`: Sequential checks with sleep(750) between. Wrap readonly in `fancyFetch` with 429 backoff.
   - Test: Simulate large history; monitor network tab for spacing.

6. **Decoding Polish (N2F, 15min)**:
   - Files: `src/utilities/transactions.ts`.
   - In `transactions.ts`: Per-arg try-catch in `decodeTxArgs`; return partial (e.g., { ...base, partialArgs: decodedArgs.filter(Boolean) }).
   - Use config for expected arg types/counts (e.g., from `CITY_CONFIG[city][version][module].functions[func].args` – add to config if needed).

7. **Component Updates (N2H, 30-45min)**:
   - Files: `src/components/tabs/mia.tsx`, `src/components/tabs/nyc.tsx`, `src/components/transaction-list.tsx`, `src/components/transaction-details-dialog.tsx`.
   - In `mia.tsx`/`nyc.tsx`: Use `useMemo` for `filteredTransactions`. Add error text if history fetch fails (e.g., "Some checks failed"). Claim buttons: Already enabled on "unclaimed" status.
   - For redemption (future): In checkEligibility, fetch balances via config contracts; add postConditions in executeRedemption (e.g., Pc.ft(...) for each version).
   - In `transaction-details-dialog.tsx`: Show category from decode; fallback raw args with hex.

8. **General Polish and Testing (N2H, 15-30min)**:
   - Files: `src/store/stacks.ts`, `src/hooks/useCityHistory.ts`.
   - Add LocalStorage TTL for userIds (e.g., `{ data: { ... }, timestamp: Date.now() }`; refresh if >1hr).
   - Test: Use addresses with v1 core, v2 core, shared txs. Verify no bursts (network tab), history accuracy (manual explorer check), unclaimed detection.
   - Modularity: For new filters (e.g., redemption), add to config/REGISTRY; extend `categorize`/`buildCityTxFilter`; add accordion in Mia/Nyc (e.g., if includeRedemption, render RedemptionHistory like mining).

## Revision History
- **Initial Plan**: High-level overview from first analysis.
- **Update 1**: Incorporated `cities.js`, prioritization (N2F/N2H), API spacing, historical focus, structured userIds, modularity for new filters.
- **Update 2**: Updated to use `citycoins-protocol.js` pattern for CITY_CONFIG (versions: legacyV1/legacyV2/daoV1/daoV2; helpers like getVersionByBlock/getCitySettings). Extend for transaction matching (e.g., add .transactionFilters to config with functions per module/version; use in buildCityTxFilter/decodeTxArgs). Emphasize clean/simple/modular code (e.g., export helpers for easy extension; no hardcodes; add redemption as new module with .redemption: { contract, functions: ['redeem-mia'] }).
- **Next Updates**: Add after each implementation phase (e.g., post-N2F testing notes).
