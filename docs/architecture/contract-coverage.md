# CityCoins Contract Coverage

Created: 2026-05-11

This audit compares `src/config/city-config.ts` and `src/utilities/transactions.ts` with the canonical CityCoins protocol source in `~/dev/citycoins/protocol/contracts/`, governance context in `~/dev/citycoins/governance`, and the deployed CCIP-026 source in `~/dev/citycoins/clarity-ccip-026/contracts/`.

## Scope

The transaction decoder supports user-facing claims dashboard events:

- Mining: `mine-tokens`, `mine-many`, `mine`
- Mining claims: `claim-mining-reward`
- Stacking: `stack-tokens`, `stack`
- Stacking claims: `claim-stacking-reward`
- Redemption: `redeem-mia`, `redeem-nyc`

Admin, DAO auth, treasury management, token-direct, proposal execution, and voting calls are intentionally out of scope for `decodeTxArgs`; they are not claim activities surfaced by the dashboard.

## Findings

| Finding | Resolution |
| --- | --- |
| Redemption contracts were configured but absent from `CITYCOINS_CONTRACTS`. | Added redemption contract lookup to `city-config.ts` and included redemption contracts in the decoder allow-list. |
| `decodeTxArgs` did not decode `redeem-mia` or `redeem-nyc`. | Added redemption decoding and tests for legacy MIA, CCIP-026 MIA, and NYC redemption calls. |
| `ccd012-redemption-nyc` exists in the protocol source tree but did not ship. | Left the existing NYC redemption config unchanged and did not treat `ccd012-redemption-nyc` as canonical deployed coverage. |
| Deployed CCIP-026 uses `ccd013-burn-to-exit-mia`. | Added explicit decoder allow-list coverage for `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ccd013-burn-to-exit-mia`. |
| DAO `stack` source uses `(cityName, amount, lockPeriod)`. | Decoder supports the current three-argument shape and keeps legacy list-shape tolerance for historical safety. |
| DAO stacking uses the same contract across v1/v2, so contract ID alone cannot identify the version. | Stacking entries and claims resolve `daoV1`/`daoV2` from the reward cycle range. |
| CCIP-020 gracefully shut down stacking after cycle 86. | DAO v2 stacking is capped at cycle 86; later cycles are ignored for claim entry creation. |
| Token contracts expose `transfer`, `burn`, and `send-many`. | Left out of `decodeTxArgs` because token-direct calls are not mining, stacking, claim, or redemption actions. |

## Cycle Continuity

Configured stacking cycle ranges are continuous:

| City | Ranges |
| --- | --- |
| MIA | `1-16`, `17-34`, `35-53`, `54-83` |
| NYC | `1-10`, `11-28`, `29-53`, `54-83` |

`getBlockCycle` and `getCycleFirstBlock` both use `startCycle`, so each version maps absolute cycle numbers without gaps or overlaps.

## Public Function Inventory

| Contract | Public functions | Coverage |
| --- | --- | --- |
| `base-dao` | `construct`, `execute`, `request-extension-callback`, `set-extension`, `set-extensions` | Out of scope: DAO administration. |
| `ccd001-direct-execute` | `callback`, `direct-execute`, `is-dao-or-extension`, `set-approver`, `set-signals-required`, `set-sunset-block` | Out of scope: DAO administration. |
| `ccd002-treasury` | `callback`, `delegate-stx`, `deposit-ft`, `deposit-nft`, `deposit-stx`, `is-dao-or-extension`, `revoke-delegate-stx`, `set-allowed`, `set-allowed-list`, `withdraw-ft`, `withdraw-nft`, `withdraw-stx` | Out of scope: treasury administration. |
| `ccd002-treasury-v2` | `callback`, `delegate-stx`, `deposit-ft`, `deposit-nft`, `deposit-stx`, `is-dao-or-extension`, `revoke-delegate-stx`, `set-allowed`, `set-allowed-list`, `withdraw-ft`, `withdraw-nft`, `withdraw-stx` | Out of scope: treasury administration. |
| `ccd002-treasury-v3` | `callback`, `delegate-stx`, `deposit-ft`, `deposit-nft`, `deposit-stx`, `is-dao-or-extension`, `revoke-delegate-stx`, `set-allowed`, `set-allowed-list`, `withdraw-ft`, `withdraw-nft`, `withdraw-stx` | Out of scope: treasury administration. |
| `ccd003-user-registry` | `callback`, `get-or-create-user-id`, `is-dao-or-extension` | Out of scope: registry administration. |
| `ccd004-city-registry` | `callback`, `get-or-create-city-id`, `is-dao-or-extension` | Out of scope: registry administration. |
| `ccd005-city-data` | `add-treasury`, `callback`, `is-dao-or-extension`, `set-activation-details`, `set-activation-status`, `set-coinbase-amounts`, `set-coinbase-details`, `set-coinbase-thresholds` | Out of scope: city metadata administration. |
| `ccd006-citycoin-mining` | `callback`, `claim-mining-reward`, `is-dao-or-extension`, `mine`, `set-mining-enabled`, `set-reward-delay` | Covered: `mine`, `claim-mining-reward`. Others out of scope. |
| `ccd006-citycoin-mining-v2` | `callback`, `claim-mining-reward`, `is-dao-or-extension`, `mine`, `set-mining-enabled`, `set-reward-delay` | Covered: `mine`, `claim-mining-reward`. Others out of scope. |
| `ccd007-citycoin-stacking` | `callback`, `claim-stacking-reward`, `is-dao-or-extension`, `is-extension`, `set-stacking-enabled`, `set-stacking-reward`, `stack` | Covered: `stack`, `claim-stacking-reward`. Others out of scope. |
| `ccd008-city-activation` | `activate-city`, `callback`, `is-dao-or-extension` | Out of scope: activation administration. |
| `ccd009-auth-v2-adapter` | `activate-job-mia`, `activate-job-nyc`, `add-principal-argument-mia`, `add-principal-argument-nyc`, `add-uint-argument-mia`, `add-uint-argument-nyc`, `approve-job-mia`, `approve-job-nyc`, `callback`, `create-job-mia`, `create-job-nyc`, `disapprove-job-mia`, `disapprove-job-nyc`, `execute-replace-approver-job-mia`, `execute-replace-approver-job-nyc`, `execute-update-coinbase-amounts-job-mia`, `execute-update-coinbase-amounts-job-nyc`, `execute-update-coinbase-thresholds-job-mia`, `execute-update-coinbase-thresholds-job-nyc`, `execute-upgrade-core-contract-job-mia`, `execute-upgrade-core-contract-job-nyc`, `is-dao-or-extension` | Out of scope: auth/job administration. |
| `ccd010-core-v2-adapter` | `activate-core-contracts`, `callback`, `claim-mining-reward`, `claim-stacking-reward`, `is-extension`, `mine-many`, `mine-tokens`, `mint-coinbase`, `register-user`, `set-city-wallet`, `shutdown-contract`, `stack-tokens`, `update-coinbase-amounts`, `update-coinbase-thresholds` | Covered if encountered through configured core contracts: `mine-tokens`, `mine-many`, `stack-tokens`, `claim-mining-reward`, `claim-stacking-reward`. Adapter contract itself is out of scope. |
| `ccd011-stacking-payouts` | `callback`, `is-dao-or-extension`, `send-stacking-reward-mia`, `send-stacking-reward-nyc`, `set-pool-operator` | Out of scope: pool payout administration. |
| `ccd012-redemption-nyc` | `callback`, `initialize-redemption`, `is-dao-or-extension`, `redeem-nyc` | Not covered: present in protocol source but not shipped. |
| `ccd013-burn-to-exit-mia` | `callback`, `initialize-redemption`, `is-dao-or-extension`, `redeem-mia` | Covered: `redeem-mia`. Others out of scope. |
| `ccip026-miamicoin-burn-to-exit` | `execute`, `vote-on-proposal` | Out of scope for claims decoding. Covered by voting UI work in Phase 2. |
| `miamicoin-core-v1`, `newyorkcitycoin-core-v1` | `claim-mining-reward`, `claim-stacking-reward`, `mine-many`, `mine-tokens`, `register-user`, `set-city-wallet`, `shutdown-contract`, `stack-tokens`, test helpers | Covered: mining, stacking, and claim functions. Others out of scope. |
| `miamicoin-core-v1-patch`, `newyorkcitycoin-core-v1-patch` | `burn-mia-v1` on MIA patch, `claim-mining-reward`, `claim-stacking-reward`, `mine-tokens`, `register-user`, `set-city-wallet`, `shutdown-contract`, `stack-tokens` | Covered: mining, stacking, and claim functions. Patch/admin functions out of scope. |
| `miamicoin-core-v2`, `newyorkcitycoin-core-v2` | `claim-mining-reward`, `claim-stacking-reward`, `mine-many`, `mine-tokens`, `register-user`, `set-city-wallet`, `shutdown-contract`, `stack-tokens`, `update-coinbase-amounts`, `update-coinbase-thresholds` | Covered: mining, stacking, and claim functions. Others out of scope. |
| `miamicoin-token`, `miamicoin-token-v2`, `newyorkcitycoin-token`, `newyorkcitycoin-token-v2` | `activate-token`, `burn`, `mint`, `send-many`, `set-token-uri`, `transfer`, version-specific coinbase/test helpers | Out of scope: token-direct calls are not claims dashboard events. |
| `miamicoin-auth`, `miamicoin-auth-v2`, `newyorkcitycoin-auth`, `newyorkcitycoin-auth-v2` | job creation/activation/approval/disapproval, argument mutation, core upgrade execution, city wallet updates, URI updates, test helpers | Out of scope: legacy auth administration. |
| `ccip012-bootstrap`, `ccip013-activation`, `ccip013-migration`, `ccip014-pox-3-v2` | `execute` | Out of scope for claims decoding. |
| `ccip014-pox-3`, `ccip016-missed-payouts`, `ccip016-missed-payouts-v2`, `ccip017-extend-sunset-period`, `ccip019-pox-4-stacking`, `ccip020-graceful-protocol-shutdown`, `ccip021-extend-sunset-period-2`, `ccip022-treasury-redemption-nyc`, `ccip024-miamicoin-signal-vote`, `ccip025-extend-sunset-period-3` | `execute`, `vote-on-proposal` | Out of scope for claims decoding; proposal pages handle voting. |

## Decoder Coverage Matrix

| Function | Contracts | Status |
| --- | --- | --- |
| `mine-tokens` | Legacy core contracts | Covered |
| `mine-many` | Legacy core contracts | Covered |
| `mine` | `ccd006-citycoin-mining`, `ccd006-citycoin-mining-v2` | Covered |
| `stack-tokens` | Legacy core contracts | Covered |
| `stack` | `ccd007-citycoin-stacking` | Covered |
| `claim-mining-reward` | Legacy core contracts, DAO mining contracts | Covered |
| `claim-stacking-reward` | Legacy core contracts, DAO stacking contract, DAO stacking treasury contracts | Covered |
| `redeem-mia` | `ccd012-redemption-mia`, `ccd013-burn-to-exit-mia` | Covered |
| `redeem-nyc` | Existing configured NYC redemption contract | Covered if encountered through config; `ccd012-redemption-nyc` is not treated as shipped. |
