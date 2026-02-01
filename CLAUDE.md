# CityCoins UI v2

Frontend for claiming CityCoins mining and stacking rewards.

## Quick Reference

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm test         # Run vitest tests
```

Deployed via Cloudflare Pages - push to main triggers deploy.

## Architecture

### State Management (Jotai)

- `src/store/stacks.ts` - Transaction fetching, block heights, wallet state
- `src/store/claims.ts` - Mining/stacking entry processing, status computation
- `src/store/verification.ts` - Claim verification cache, cross-tab sync

### Key Utilities

- `src/utilities/hiro-client.ts` - Rate-limited Hiro API client (use `hiroFetch`)
- `src/utilities/transactions.ts` - Transaction argument decoding
- `src/utilities/storage-monitor.ts` - localStorage quota monitoring
- `src/utilities/broadcast-sync.ts` - Cross-tab BroadcastChannel sync

### Contract Reads

- `src/utilities/contract-reads/` - Per-version claim verification
- `src/utilities/citycoins-legacy-api.ts` - Legacy v1/v2 contracts
- `src/utilities/citycoins-protocol-api.ts` - DAO v1/v2 contracts

## Data Flow

```
Hiro API -> hiroFetch -> getAllTxs() -> LZString compress -> localStorage
                                                                  |
                                                                  v
                                              transactionsAtom -> processedTransactionsAtom
                                                                  |
                                              +-------------------+-------------------+
                                              v                                       v
                                    miningEntriesAtom                      stackingEntriesAtom
                                              |                                       |
                                              v                                       v
                                  verifiedMiningEntriesAtom              verifiedStackingEntriesAtom
```

## Testing

Tests use vitest. Key test files:
- `src/store/__tests__/claims.test.ts` - Entry processing, status logic
- `src/store/__tests__/verification.test.ts` - Cache behavior
- `src/utilities/__tests__/transactions.test.ts` - Arg decoding

## Documentation

- `docs/tx-detection-flow.md` - How transactions become entries
- `docs/architecture/` - Audit docs (state machines, rate limiting, performance)

## CityCoins Contracts

Two cities (MIA, NYC) across four versions:
- `legacyV1` - Original core contracts
- `legacyV2` - Updated core contracts
- `daoV1` - DAO mining/stacking (shared contracts, city in args)
- `daoV2` - Current DAO version

DAO contracts use `cityName` arg to distinguish cities. Legacy contracts are city-specific.
