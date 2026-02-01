# Phases: Transaction Data Flow Audit

## Phase Overview

| Phase | Name | Goal | Dependencies |
|-------|------|------|--------------|
| 1 | Document Transaction Fetch Flow | Map data from Hiro API through localStorage to atoms | None |
| 2 | Document State Machine Transitions | Trace all status transitions with data sources | Phase 1 |
| 3 | Identify Rate Limiting Bottlenecks | Profile API usage patterns, find inefficiencies | Phase 1 |
| 4 | Audit Stale State Sources | Find where incorrect status can occur | Phase 2 |
| 5 | Add State Transition Tests | Test critical paths in claims state machine | Phase 2, 4 |
| 6 | Document Performance Issues | Profile large wallet scenarios (1k-10k txs) | Phase 1, 3 |

---

## Phase 1: Document Transaction Fetch Flow

### Goal
Create a complete map of how transaction data flows from Hiro API fetch through localStorage compression to Jotai atoms. Document the deduplication logic, pagination handling, and progress tracking.

### Key Deliverables
1. Updated `docs/tx-fetch-flow.md` with:
   - Sequence diagram of fetch process
   - Deduplication algorithm explanation
   - localStorage compression strategy
   - Error recovery and partial save behavior
2. Annotated code comments in `stacks.ts` identifying key decision points

### Files to Examine
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (lines 390-526: `getAllTxs`)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/common.ts` (`fancyFetch`, `sleep`)

### Verification
- Documentation covers: initial fetch, pagination loop, deduplication, compression, progress updates
- All error handling paths are documented

### Dependencies
None

---

## Phase 2: Document State Machine Transitions

### Goal
Trace how mining/stacking entries move through status states. Document all inputs that can trigger transitions and where each status is computed.

### Key Deliverables
1. Updated `docs/state-machine.md` with:
   - Complete state diagram for MiningStatus and StackingStatus
   - Data sources for each transition (transaction history vs. verification cache)
   - Priority rules when multiple sources conflict
2. Inline documentation in `claims.ts` explaining the verification integration

### Files to Examine
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/claims.ts` (entire file)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/verification.ts` (lines 196-284: single verification)

### Verification
- Every status value has a documented path to reach it
- Priority between tx history and verification cache is clear

### Dependencies
- Phase 1 (need to understand transaction data source)

---

## Phase 3: Identify Rate Limiting Bottlenecks

### Goal
Profile the rate limiting implementation to identify inefficiencies, especially for large wallets. Document where rate limits are hit and why.

### Key Deliverables
1. `docs/rate-limiting-audit.md` with:
   - Current rate limiting strategy (header-aware vs. fixed delay)
   - Bottleneck analysis: where do 429s occur?
   - Comparison: tx fetch (fancyFetch) vs. contract reads (hiroFetch)
   - Queue behavior analysis for batch verification
2. Recommendations section (do not implement, just document)

### Files to Examine
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/hiro-client.ts` (entire file)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (lines 457-512: pagination with sleep)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/verification.ts` (lines 289-409: verifyAllMiningAtom)

### Verification
- Document identifies at least 2 bottleneck scenarios
- Current delays are justified or flagged as potential improvements

### Dependencies
- Phase 1 (understand fetch patterns)

---

## Phase 4: Audit Stale State Sources

### Goal
Find all scenarios where claims status can become stale or incorrect. Focus on cache invalidation, timing issues, and edge cases.

### Key Deliverables
1. `docs/stale-state-audit.md` with:
   - Scenario catalog: how can status become stale?
   - Cache lifetime analysis (verification cache has no TTL)
   - Race condition potential (concurrent verification)
   - Edge cases: wallet switch, transaction reorg, partial fetch
2. Severity ratings for each scenario

### Files to Examine
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/verification.ts` (cache management)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/claims.ts` (entry creation and update)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (transaction persistence)

### Verification
- At least 3 distinct stale state scenarios documented
- Each scenario has a clear trigger and impact description

### Dependencies
- Phase 2 (understand state transitions)

---

## Phase 5: Add State Transition Tests

### Goal
Add unit tests for critical state transitions in the claims state machine. Focus on the boundary conditions and priority logic.

### Key Deliverables
1. Test file `src/store/__tests__/claims.test.ts` with tests for:
   - Mining entry status from transaction processing
   - Verification cache integration
   - Priority: tx history > verification cache > base status
   - Edge cases: claim tx failure, concurrent verification
2. Test file `src/utilities/__tests__/transactions.test.ts` with tests for:
   - `decodeTxArgs` for all function types
   - `isValidMiningTxArgs`, `isValidStackingTxArgs` validation

### Files to Create
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/__tests__/claims.test.ts`
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/__tests__/transactions.test.ts`

### Verification
- Tests pass with `npm test`
- Coverage includes happy path and at least 2 edge cases per function

### Dependencies
- Phase 2 (understand state machine)
- Phase 4 (understand stale state scenarios)

---

## Phase 6: Document Performance Issues

### Goal
Profile and document performance characteristics for wallets with 100-10,000 transactions. Identify memory, CPU, and render bottlenecks.

### Key Deliverables
1. `docs/performance-audit.md` with:
   - Memory profile: localStorage size, atom derivation chains
   - CPU profile: LZ-String compression, Clarity deserialization
   - Render profile: virtualization effectiveness, summary recomputation
   - Scaling analysis: how does performance degrade with tx count?
2. Metrics collection methodology for future profiling

### Files to Examine
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/stacks.ts` (LZ compression)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/claims.ts` (atom derivation chains)
- `/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/components/claims/VirtualizedMiningTable.tsx`

### Verification
- Document includes concrete numbers for tx counts: 100, 1000, 5000, 10000
- At least 2 performance hotspots identified

### Dependencies
- Phase 1 (understand data flow)
- Phase 3 (understand rate limiting impact)

---

## Recommended Execution Order

1. **Phase 1** (foundation) - 1-2 hours
2. **Phase 2** (builds on 1) - 1-2 hours
3. **Phase 3** (parallel with 2) - 1-2 hours
4. **Phase 4** (needs 2) - 1-2 hours
5. **Phase 5** (needs 2, 4) - 2-3 hours
6. **Phase 6** (needs 1, 3) - 2-3 hours

Total estimated time: 8-14 hours

## Notes

- **Audit-first approach**: Each phase documents the current state without making changes
- **Independent verification**: Each phase produces a standalone deliverable
- **Test phase last**: Tests are written after the system is fully understood
- **Performance profiling**: Saved for last to benefit from earlier documentation
