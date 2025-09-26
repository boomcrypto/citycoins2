// Minimal registry + helpers for mining/stacking only

export type City = 'mia' | 'nyc';
export type Version = 'v1' | 'v2';
export type Module = 'core' | 'mining' | 'stacking' | 'token';

export const CORE_FUNCTIONS = [
  'mine-tokens',           // (uint, optional(buff 34))
  'mine-many',             // (list 200 uint)
  'claim-mining-reward',   // (uint)
  'stack-tokens',          // (uint, uint)
  'claim-stacking-reward', // (uint)
] as const;

export const CCD006_FUNCTIONS = [
  'mine',                  // (string-ascii 10, list 200 uint)
  'claim-mining-reward',   // (string-ascii 10, uint)
] as const;

export const CCD007_FUNCTIONS = [
  'stack',                 // (string-ascii 10, uint, uint)
  'claim-stacking-reward', // (string-ascii 10, uint)
] as const;

export const TOKEN_FUNCTIONS = ['transfer'] as const;

type ContractId = `${string}.${string}`;

type Entry = {
  city: City;
  version: Version;
  module: Module;
  contract: ContractId; // fully-qualified (address.name)
  functions: readonly string[];
};

// REGISTRY: mining + stacking only
export const REGISTRY: Entry[] = [
  // MIA core
  {
    city: 'mia', version: 'v1', module: 'core',
    contract: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
    functions: CORE_FUNCTIONS,
  },
  {
    city: 'mia', version: 'v2', module: 'core',
    contract: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
    functions: CORE_FUNCTIONS,
  },

  // NYC core
  {
    city: 'nyc', version: 'v1', module: 'core',
    contract: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
    functions: CORE_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v2', module: 'core',
    contract: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
    functions: CORE_FUNCTIONS,
  },

  // Shared mining (ccd006) v1 & v2
  {
    city: 'mia', version: 'v1', module: 'mining',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining',
    functions: CCD006_FUNCTIONS,
  },
  {
    city: 'mia', version: 'v2', module: 'mining',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    functions: CCD006_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v1', module: 'mining',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining',
    functions: CCD006_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v2', module: 'mining',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    functions: CCD006_FUNCTIONS,
  },

  // Shared stacking (ccd007)
  {
    city: 'mia', version: 'v1', module: 'stacking',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    functions: CCD007_FUNCTIONS,
  },
  {
    city: 'mia', version: 'v2', module: 'stacking',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    functions: CCD007_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v1', module: 'stacking',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    functions: CCD007_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v2', module: 'stacking',
    contract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    functions: CCD007_FUNCTIONS,
  },
  // MIA token
  {
    city: 'mia', version: 'v1', module: 'token',
    contract: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token',
    functions: TOKEN_FUNCTIONS,
  },
  {
    city: 'mia', version: 'v2', module: 'token',
    contract: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2',
    functions: TOKEN_FUNCTIONS,
  },
  // NYC token
  {
    city: 'nyc', version: 'v1', module: 'token',
    contract: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token',
    functions: TOKEN_FUNCTIONS,
  },
  {
    city: 'nyc', version: 'v2', module: 'token',
    contract: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2',
    functions: TOKEN_FUNCTIONS,
  },
];

// Build the same structure you used in NYC/MIA components:
export function buildCityTxFilter(city: City) {
  return REGISTRY
    .filter(e => e.city === city)
    .map(e => ({ contract: e.contract, functions: [...e.functions] }));
}

// Convenience: quick category from function name
export function categorize(func: string): 'Mining' | 'Mining Claim' | 'Stacking' | 'Stacking Claim' | 'Transfer' | 'Other' {
  if (['mine-tokens', 'mine-many', 'mine'].includes(func)) return 'Mining';
  if (func === 'claim-mining-reward') return 'Mining Claim';
  if (['stack-tokens', 'stack'].includes(func)) return 'Stacking';
  if (func === 'claim-stacking-reward') return 'Stacking Claim';
  if (func === 'transfer') return 'Transfer';
  return 'Other';
}

// Try find matching entry for a contract_id + func
export function findEntry(contractId: string, func: string) {
  return REGISTRY.find(e => e.contract === contractId && e.functions.includes(func));
}
