# Transaction Detection Flow

This document describes how transactions are processed to create mining and stacking entries.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRANSACTION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    User Address
         │
         ▼
┌─────────────────┐
│ Fetch All TXs   │  (transactionsAtom in stacks.ts)
│ from Hiro API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ transactionsAtom│  Raw TX array (all types)
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ miningEntriesAtom│                    │stackingEntriesAtom│
│   (claims.ts)   │                    │   (claims.ts)   │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│verifiedMining   │                    │verifiedStacking │
│  EntriesAtom    │                    │  EntriesAtom    │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ├──────────┬───────────┐               ├──────────┬───────────┐
         ▼          ▼           ▼               ▼          ▼           ▼
    miaMining  nycMining   (filtered)     miaStacking nycStacking (filtered)
    EntriesAtom EntriesAtom              EntriesAtom EntriesAtom
```

## Mining Entry Creation (miningEntriesAtom)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MINING ENTRY CREATION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

For each TX in transactionsAtom:

┌──────────────┐
│   Start TX   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐     No
│ tx_type === "contract│────────────► Skip TX
│      _call"?         │
└──────────┬───────────┘
           │ Yes
           ▼
┌──────────────────────┐     No
│ tx_status === "success"│──────────► Skip TX (for mining entries)
└──────────┬───────────┘              │
           │ Yes                      │ (but process for claims if
           ▼                          │  abort_by_response)
┌──────────────────────┐     No
│ functionName in      │────────────► Skip TX
│ ['mine-tokens',      │
│  'mine-many', 'mine']│
└──────────┬───────────┘
           │ Yes
           ▼
┌──────────────────────┐
│   decodeTxArgs(tx)   │
│                      │
│ Extracts:            │
│ - amountsUstx[]      │
│ - cityName (DAO only)│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     null
│ isValidMiningTxArgs? │────────────► Skip TX
└──────────┬───────────┘
           │ Valid
           ▼
┌─────────────────────────────────────────────────────────────────┐
│           getCityVersionFromContractAndArgs(contractId, decoded) │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │ findContractInfo    │                                        │
│  │   (contractId)      │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Iterates: for city in ['mia', 'nyc']                    │    │
│  │           for version in ['legacyV1','legacyV2',        │    │
│  │                           'daoV1','daoV2']              │    │
│  │                                                         │    │
│  │ Returns FIRST match where contractId matches:           │    │
│  │   - config.mining.contractId                            │    │
│  │   - config.stacking.contractId                          │    │
│  │   - config.stacking.claimContractId                     │    │
│  └──────────┬──────────────────────────────────────────────┘    │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ info = { city, version, module }                        │    │
│  │                                                         │    │
│  │ PROBLEM: For shared DAO contracts, always returns       │    │
│  │ 'mia' because it's checked first!                       │    │
│  │                                                         │    │
│  │ Shared contracts:                                       │    │
│  │ - ccd006-citycoin-mining (daoV1) - MIA & NYC            │    │
│  │ - ccd006-citycoin-mining-v2 (daoV2) - MIA & NYC         │    │
│  │ - ccd007-citycoin-stacking (daoV1/V2) - MIA & NYC       │    │
│  └──────────┬──────────────────────────────────────────────┘    │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Version Check:                                          │    │
│  │                                                         │    │
│  │ if (legacyV1 || legacyV2):                             │    │
│  │   return { city: info.city, version }  ◄── Correct!    │    │
│  │                                                         │    │
│  │ if (module === 'stacking-claim'):                       │    │
│  │   return { city: info.city, version }  ◄── Correct!    │    │
│  │                                                         │    │
│  │ // For shared DAO mining/stacking contracts:            │    │
│  │ if (decoded.cityName):                                  │    │
│  │   return { city: decoded.cityName, version }           │    │
│  │ else:                                                   │    │
│  │   return undefined  ◄── TX skipped if no cityName!     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │
           │ Returns { city, version } or undefined
           ▼
┌──────────────────────┐     undefined
│ cityVersion defined? │────────────► Skip TX
└──────────┬───────────┘
           │ Yes
           ▼
┌──────────────────────────────────────┐
│ Create entry for each block mined:   │
│                                      │
│ for i in 0..numBlocks:               │
│   entries.push({                     │
│     txId,                            │
│     block: tx.block_height + i,      │
│     city,        ◄── From detection  │
│     version,     ◄── From detection  │
│     contractId,                      │
│     functionName,                    │
│     amountUstx: amountsUstx[i],      │
│     status: 'pending' | 'unverified' │
│   })                                 │
└──────────────────────────────────────┘
```

## Contract ID to City/Version Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTRACT MAPPING TABLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

MINING CONTRACTS:
┌────────────────────────────────────────────────────────────┬──────┬──────────┐
│ Contract ID                                                │ City │ Version  │
├────────────────────────────────────────────────────────────┼──────┼──────────┤
│ SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1│ MIA  │ legacyV1 │
│ SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2│ MIA  │ legacyV2 │
│ SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1│ NYC │ legacyV1 │
│ SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2│ NYC │ legacyV2 │
├────────────────────────────────────────────────────────────┼──────┼──────────┤
│ SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining   │ SHARED │ daoV1 │
│ SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2│ SHARED │ daoV2 │
└────────────────────────────────────────────────────────────┴──────┴──────────┘

STACKING CONTRACTS:
┌────────────────────────────────────────────────────────────┬──────┬──────────┐
│ Contract ID                                                │ City │ Version  │
├────────────────────────────────────────────────────────────┼──────┼──────────┤
│ SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1│ MIA  │ legacyV1 │
│ SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2│ MIA  │ legacyV2 │
│ SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1│ NYC │ legacyV1 │
│ SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2│ NYC │ legacyV2 │
├────────────────────────────────────────────────────────────┼──────┼──────────┤
│ SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking │ SHARED │ daoV1/V2│
└────────────────────────────────────────────────────────────┴──────┴──────────┘

STACKING CLAIM (TREASURY) CONTRACTS:
┌────────────────────────────────────────────────────────────┬──────┬──────────┐
│ Contract ID                                                │ City │ Version  │
├────────────────────────────────────────────────────────────┼──────┼──────────┤
│ SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-stacking│MIA│daoV1/V2│
│ SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-nyc-stacking│NYC│daoV1/V2│
└────────────────────────────────────────────────────────────┴──────┴──────────┘
```

## City Filtering (Final Step)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CITY FILTERING                                     │
└─────────────────────────────────────────────────────────────────────────────┘

verifiedMiningEntriesAtom (all cities)
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────┐
│ miaMiningEntriesAtom│               │ nycMiningEntriesAtom│
│                     │               │                     │
│ entries.filter(     │               │ entries.filter(     │
│   e => e.city ==='mia'│               │   e => e.city ==='nyc'│
│ )                   │               │ )                   │
└─────────────────────┘               └─────────────────────┘

If entry.city is wrong at creation time, filtering will produce wrong results!
```

## Potential Issues Identified

### Issue 1: Shared DAO Contracts Return Wrong City

```
User mines NYC via ccd006-citycoin-mining with cityName='nyc'
         │
         ▼
findContractInfo('ccd006-citycoin-mining')
         │
         ▼
Iterates ['mia', 'nyc'] × ['legacyV1', 'legacyV2', 'daoV1', 'daoV2']
         │
         ▼
First match: MIA daoV1 (because 'mia' is checked before 'nyc')
         │
         ▼
Returns: { city: 'mia', version: 'daoV1', module: 'mining' }
         │
         ▼
getCityVersionFromContractAndArgs checks: is daoV1? YES
         │
         ▼
Checks decoded.cityName = 'nyc'
         │
         ▼
Returns: { city: 'nyc', version: 'daoV1' }  ◄── CORRECT (if cityName extracted)
```

### Issue 2: cityName Extraction May Fail

```
decodeTxArgs for 'mine' function:
         │
         ▼
case "mine":
  if (decodedArgs.length < 2 || !Array.isArray(decodedArgs[1])) return null;
  structured.cityName = decodedArgs[0];  ◄── What if this is not a string?
  structured.amountsUstx = decodedArgs[1].map(...)
         │
         ▼
If decodedArgs[0] is not properly decoded, cityName could be:
  - undefined
  - a Clarity value object instead of string
  - wrong case (e.g., 'MIA' vs 'mia')
```

## Debug Points

To investigate the 449/449 issue, add logging at these points:

1. **In `decodeTxArgs`** - Log the raw decodedArgs[0] for 'mine' function
2. **In `getCityVersionFromContractAndArgs`** - Log decoded.cityName value
3. **In `miningEntriesAtom`** - Log each entry's city before push
4. **Count entries by city** - Add a debug atom to count entries per city

```typescript
// Example debug logging:
console.log('TX:', tx.tx_id);
console.log('Contract:', contractId);
console.log('Function:', functionName);
console.log('Decoded cityName:', decoded?.cityName, 'type:', typeof decoded?.cityName);
console.log('Final city/version:', cityVersion);
```
