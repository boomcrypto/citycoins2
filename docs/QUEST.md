# Quest: Transaction Data Flow Audit

## Goal Statement

Review and document all transaction fetching, identification, and state machine flows. Map data from API fetch through to UI state. Identify rate limiting bottlenecks, sources of stale/incorrect state, and performance issues for large wallets (100-10,000 txs). Add tests for critical state transitions.

## Known Pain Points

- Rate limiting hits (especially for large wallets)
- Stale/incorrect claims status
- UI performance degradation with many transactions

## Linked Repositories

- Primary: `boomcrypto/citycoins-ui-v2` (this repo)
- Reference: Hiro API documentation

## Status

**Completed** - 2026-02-01

All 6 phases delivered and merged in PR #50.

## Key Files

### State Management (Jotai Atoms)
- `src/store/stacks.ts` - Transaction fetching, block heights, user IDs
- `src/store/claims.ts` - Mining/stacking entry processing, status computation
- `src/store/verification.ts` - Verification cache, manual verification actions

### Business Logic
- `src/utilities/transactions.ts` - Transaction argument decoding
- `src/utilities/hiro-client.ts` - Rate-limited Hiro API client
- `src/utilities/claim-verification.ts` - Claim verification routing
- `src/utilities/citycoins-legacy-api.ts` - Legacy v1/v2 contract reads
- `src/utilities/citycoins-protocol-api.ts` - DAO v1/v2 contract reads

### Contract Reads
- `src/utilities/contract-reads/legacy-mining.ts`
- `src/utilities/contract-reads/legacy-stacking.ts`
- `src/utilities/contract-reads/dao-mining.ts`
- `src/utilities/contract-reads/dao-stacking.ts`

### Existing Documentation
- `docs/tx-detection-flow.md` - Transaction detection flow diagrams

## Architecture Overview

```
User Address
    |
    v
transactionsAtom (stacks.ts)    <-- Fetches from Hiro API via fancyFetch
    |                               Uses LZ-String compression for localStorage
    |
    v
processedTransactionsAtom (claims.ts)  <-- Single-pass processing with cache
    |
    +-- miningEntriesAtom           <-- Tracks mined blocks
    |       |
    |       v
    |   verifiedMiningEntriesAtom   <-- Applies verification cache
    |       |
    |       +-- miaMiningEntriesAtom
    |       +-- nycMiningEntriesAtom
    |
    +-- stackingEntriesAtom         <-- Tracks stacked cycles
            |
            v
        verifiedStackingEntriesAtom <-- Applies verification cache
            |
            +-- miaStackingEntriesAtom
            +-- nycStackingEntriesAtom
```

## Rate Limiting Architecture

1. **Transaction Fetch** (`stacks.ts`)
   - Uses `fancyFetch` with 1.5s sleep between pages
   - Exponential backoff on errors (5s, 10s, 20s)
   - Saves progress every 500 txs

2. **Contract Reads** (`hiro-client.ts`)
   - Queue-based rate limiting with header tracking
   - Reads `x-ratelimit-remaining-stacks-second/minute`
   - Dynamic delays based on remaining quota
   - Retry-After header support

3. **Verification** (`verification.ts`)
   - One-by-one processing with rate-limited queue
   - Results cached in localStorage per address
   - No batch optimization currently

## State Machine: Mining Claims

```
pending     -- Block < currentBlock - 100 --> (stays pending)
pending     -- Block >= currentBlock - 100 --> unverified
unverified  -- Manual verify: won, not claimed --> claimable
unverified  -- Manual verify: not won --> not-won
unverified  -- Manual verify: already claimed --> claimed
claimable   -- Claim tx succeeds --> claimed
claimable   -- Claim tx fails --> not-won
```

## State Machine: Stacking Claims

```
locked      -- Cycle not complete --> (stays locked)
locked      -- Cycle complete --> unverified
unverified  -- Manual verify: has reward --> claimable
unverified  -- Manual verify: no reward --> no-reward
claimable   -- Claim tx succeeds --> claimed
claimable   -- Claim tx fails --> unavailable
```
