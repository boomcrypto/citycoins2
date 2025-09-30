# CityCoins UI Transaction Analysis Plan

## Updated Plan for Fixing Transaction Loading, Analysis, and Action Handling

Thank you for providing the `citycoins-protocol.js` file—it's a valuable reference that aligns well with our modular goals. It contains structured `CITY_CONFIG` data (e.g., activation blocks, contract names/addresses per city/version, token details) and `CITY_INFO` (UI-specific like logos, versions). This directly addresses gaps in dynamic configuration (e.g., activation blocks for cycle computation, contract resolution). We'll integrate it by extracting/exporting `CITY_CONFIG` into `contracts.ts` (or a new `config.ts`) for reuse across utilities/hooks, making the system more modular. For example:

- Use `CITY_CONFIG[city][version].mining.contractName` to dynamically resolve contract IDs in `buildCityTxFilter` and `findEntry`.
- Pull activation blocks (e.g., MIA legacyV1: 24497, NYC legacyV1: 37449) for `computeTargetedCycles`.
- Extend for new filters (e.g., add `redemption` module to `CITY_CONFIG` with ccd012/013 contracts/functions like `redeem-mia`/`redeem-nyc`).
- Note: From contracts, rewardCycleLength is consistently u2100, tokenRewardMaturity u100, MAX_REWARD_CYCLES u32—hardcode these in computations if not in config.

This keeps things simple: One config source for all cities/versions, easy to add new modules (e.g., redemption) without hardcoding. For UI modularity, we'll update `buildCityTxFilter` to optionally include new categories (e.g., pass `includeRedemption: true`), and components like `Mia`/`Nyc` can render new accordions/tables similarly to mining/stacking (e.g., detect redemption txs in `filteredTransactions` and add a "Redemption History" section). Focus remains on mining/stacking for now—redemption can be a quick N2H extension later.

The provided info sharpens our axe by:

- **Enabling modularity**: `CITY_CONFIG` replaces hardcoded values (e.g., genesis blocks), making multi-city/version support trivial without duplication.
- **Simplifying storage/user IDs**: Aligns with your suggested structure (e.g., `{ v1: { mia: 1, nyc: 3 }, v2: { mia: 3, nyc: 6 }, ccd003: 12 }`—we'll use this for `userIdsAtom` to cache per-version/city/shared).
- **Reducing fetches**: Confirms core contracts are isolated (need per-contract userId calls), but shared (ccd006/007) use ccd003—fetch only once per type, cache in structured atom. No direct principal support in shared (they require userId), so minimal fetches.
- **Historical focus**: Includes maturity/cycle completion checks using current block-height (all old claims are mature/completed, but simulate contract logic for accuracy), verifying "is winner/stacked?" via readonly calls like `is-block-winner` or `get-stacker-at-cycle`. For mining, check if block winner and height > maturity (tokenRewardMaturity u100). For stacking, check if amountStacked >0 and currentCycle > targetCycle.
- **API discipline**: Reinforces spacing (500-1000ms sleeps in loops, 30s backoff on 429)—no bursting, even for history checks. Use `fancyFetch` wrapper for retries.
- **Prioritization**: Shifts perf/UX to N2H; core accuracy (contracts, computations, userIds) to N2F for quick wins.

No action yet—this updated plan refines the previous one for simplicity and focus. Estimated dev time: 3-5 hours (N2F first, then N2H). We'll implement in small commits, testing with a sample address having mixed v1/v2 txs.

### Updated High-Level Overview

The flow remains: Fetch/store txs → Filter by city → Decode/compute potentials (using `CITY_CONFIG`) → Fetch/cache userIds (structured atom, only if needed) → Verify unclaimed (spaced readonly calls, including maturity/cycle checks based on current height) → Display history with claim buttons. Modularity via `CITY_CONFIG` and extensible REGISTRY (e.g., add redemption as new module). LocalStorage for txs/userIds follows the same atom pattern (compress if large). API calls spaced with sleeps/backoff. Output: Accurate "find unclaimed funds" for mining/stacking, easy to extend for redemption/votes/etc. Key contract details captured: city IDs (mia=1, nyc=2), user registry via get-or-create-user-id, mining with VRF/mod for winner, stacking with entitled reward calc.

### Specific Issues, Categorized (N2F vs N2H)

**N2F (Need to Fix – Core Accuracy, ~2-3 hours)**: These block correct history detection; fix first for functional mining/stacking.

1. **Contract Registry and Filtering**: REGISTRY duplicates shared contracts; `buildCityTxFilter` inefficient. Integrate `CITY_CONFIG` for dynamic resolution (e.g., no hardcodes). Add redemption module for future-proofing (but don't implement UI yet).
2. **User ID Resolution**: Core needs per-contract fetches (not ccd003); shared needs single ccd003 fetch. Cache in structured `userIdsAtom` (e.g., `{ v1: { mia: 1n, nyc: 3n }, v2: { mia: 3n, nyc: 6n }, ccd003: 12n }`). Fetch only for contracts with txs (pre-fetch in hook loop).
3. **Block/Cycle Computation**: Hardcoded NYC values break MIA; use `CITY_CONFIG[city][version]` for activationBlock/cycleLength (rewardCycleLength is 2100 in contracts). Validate post-activation only. Use get-reward-cycle logic: (height - activationBlock) / cycleLength.
4. **Decoding**: Partial failures silent; add try-catch per arg. Ensure city/version from `CITY_CONFIG` if decode misses it.
5. **Claim Verification**: Use `is-block-winner`/`get-stacker-at-cycle` correctly, including maturity/cycle checks (simulate > maturityHeight or currentCycle > targetCycle using current block-height). Match claimed txs exactly by block/cycle/contract. For DAO, use cityId from CITY_IDS.

**N2H (Nice to Have – Perf/UX Polish, ~1-2 hours)**: These improve reliability but aren't blockers; defer if time-constrained.

1. **API Spacing/Backoff**: Add 500-1000ms sleep in `getAllTxs` loop and history checks (e.g., `await sleep(750)` between readonly calls). On 429, backoff 30s and retry (wrap `fancyFetch` with exponential backoff).
2. **Component UX**: Memoize `filteredTransactions`; add errors/spinners in tables. Enable claim buttons only for verified unclaimed (already in status). For redemption, dynamic postConditions (fetch balances).
3. **Storage/Offline**: Version `userIdsAtom` data (e.g., TTL=1hr via timestamp). Handle mempool txs in atoms (but low priority).
4. **Modularity for New Filters**: Extend REGISTRY/filters for redemption (e.g., `buildCityTxFilter(city, { includeRedemption: true })`); add accordion in Mia/Nyc like mining (but skip impl now). Note: Redemption not in provided contracts, confirm extensions.
5. **Edge Cases**: Dedupe multi-version txs; warn on failed decodes/userIds. Test with mixed tx history, including DAO shared user IDs via ccd003. Handle ERR codes like ERR_NO_VRF_SEED_FOUND in mining claims.

### Updated General, List-Style Instructions for Fixes

Follow sequentially; test after each (e.g., load page, check console for fetches, verify history tables). Use `CITY_CONFIG` from citycoins-protocol.js as base (copy to `src/config/city-config.ts`). Simple: No new libs (e.g., no p-limit), just `sleep` and `Promise.allSettled`. Structured userIds as you suggested (per-version/city for core, single for ccd003). Use clear loading state, expect it to get there when it gets there but it always gets there. Next steps: Implement N2F items first, then test with sample address; follow with N2H for polish.

1. **Integrate Config (N2F, 15-30min)**:

   - Files: `src/config/city-config.ts` (new), `src/utilities/contracts.ts`.
   - Create `src/config/city-config.ts`: Export `CITY_CONFIG` and `CITY_INFO` from citycoins-protocol.js (add redemption module if confirmed: `{ mia: { contract: 'SP8A9...ccd012-redemption-mia', functions: ['redeem-mia'] }, nyc: { ... ccd013 } }`).
   - In `contracts.ts`: Import `CITY_CONFIG`; update REGISTRY to reference dynamically (e.g., `contract: CITY_CONFIG[city][version][module].contractName` with deployer from config). Dedupe shared (one entry with `city: 'shared'` for ccd006/007). Update `buildCityTxFilter(city)` to pull from config + include shared if needed.

2. **Fix User ID Handling (N2F, 30-45min)**:
   - Files: `src/store/stacks.ts`, `src/utilities/transactions.ts`, `src/hooks/useCityHistory.ts`.
   - In `stacks.ts`: Update `userIdsAtom` to structured object (e.g., `{ legacyV1: { mia: null, nyc: null }, legacyV2: { mia: null, nyc: null }, daoV1: { mia: null, nyc: null }, daoV2: { mia: null, nyc: null }, ccd003: null }`). Fetch only for contracts with txs (pre-fetch in hook loop, using ccd003 for DAO mining/stacking, per-core for legacy).

### Files for Context

Used with `aider` to easily import the related files to the plan above!

Readonly:

```
../../citycoins/contracts/contracts/cities/mia/mainnet/miamicoin-core-v1.clar
../../citycoins/contracts/contracts/cities/mia/mainnet/miamicoin-core-v2.clar
../../citycoins/contracts/contracts/cities/nyc/mainnet/newyorkcitycoin-core-v1.clar
../../citycoins/contracts/contracts/cities/nyc/mainnet/newyorkcitycoin-core-v2.clar
../../citycoins/protocol/contracts/extensions/ccd006-citycoin-mining-v2.clar
../../citycoins/protocol/contracts/extensions/ccd006-citycoin-mining.clar
../../citycoins/protocol/contracts/extensions/ccd007-citycoin-stacking.clar
../citycoins-ui/src/store/citycoins-protocol.js
```

Editable:

```
PLAN.md
src/App.tsx
src/components/layout/page-content.tsx
src/components/tabs/mia.tsx
src/components/tabs/nyc.tsx
src/components/tabs/voting.tsx
src/components/transaction-details-dialog.tsx
src/components/transaction-list.tsx
src/hooks/useCityHistory.ts
src/store/common.ts
src/store/stacks.ts
src/utilities/clarity.ts
src/utilities/contracts.ts
src/utilities/transactions.ts
```
