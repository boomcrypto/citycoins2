export type CoinType = 'mia' | 'nyc';

export type ContractConfig = {
  assetId: string;
  v1: {
    core: string;
    token: string;
  };
  v2: {
    core: string;
    token: string;
  };
  miningV1?: string; // Optional for v1 mining contract
  miningV2?: string; // Optional for advanced versions
  stackingV2?: string; // Optional
  redemption: string;
  functions: {
    mining: string[];
    miningClaims: string[];
    stacking: string[];
    stackingClaims: string[];
    transfer: string[];
  };
};

export const CONTRACTS: Record<CoinType, ContractConfig> = {
  mia: {
    assetId: 'miamicoin',
    v1: {
      core: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
      token: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token',
    },
    v2: {
      core: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
      token: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2',
    },
    miningV1: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining', // Placeholder if mainnet deployer unknown; update with correct address
    miningV2: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    stackingV2: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    redemption: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-mia',
    functions: {
      mining: ['mine-tokens', 'mine-many', 'mine'],
      miningClaims: ['claim-mining-reward'],
      stacking: ['stack-tokens', 'stack'],
      stackingClaims: ['claim-stacking-reward'],
      transfer: ['transfer'],
    },
  },
  nyc: {
    assetId: 'newyorkcitycoin',
    v1: {
      core: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
      token: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token',
    },
    v2: {
      core: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
      token: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2',
    },
    miningV1: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining', // Placeholder if mainnet deployer unknown; update with correct address
    miningV2: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    stackingV2: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    redemption: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc',
    functions: {
      mining: ['mine-tokens', 'mine-many', 'mine'],
      miningClaims: ['claim-mining-reward'],
      stacking: ['stack-tokens', 'stack'],
      stackingClaims: ['claim-stacking-reward'],
      transfer: ['transfer'],
    },
  },
};

// Voting contracts (shared across coins, can be expanded)
export const VOTING_CONTRACTS: Record<string, string[]> = {
  'SP34FHX44NK9KZ8KJC08WR2NHP8NEGFTTT7MTH7XD.citycoins-vote-v1': ['vote-on-proposal'],
  'SP119FQPVQ39AKVMC0CN3Q1ZN3ZMCGMBR52ZS5K6E.citycoins-vote-v2': ['vote-on-proposal'],
  'SP5X6BFPYXTZ8C63EYYPA02X2VQTG4V43XNPGAPF.citycoins-vote-v3': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown': ['vote-on-proposal'],
};

/**
 * We can do better than what's here, refactor coming in below
 * 1) we have two cities, MIA and NYC
 * 2) each city has a v1 and v2 contract set
 *   - core-v1 and v2: (define-public (mine-tokens (amountUstx uint) (memo (optional (buff 34))))
 *   - core-v1 and v2: (define-public (mine-many (amounts (list 200 uint)))
 *   - core-v1 and v2: (define-public (claim-mining-reward (minerBlockHeight uint))
 *   - core-v1 and v2: (define-public (claim-stacking-reward (targetCycle uint))
 *   - core-v1 and v2: (define-public (stack-tokens (amountTokens uint) (lockPeriod uint))
 * 3) each city uses ccd006 and ccd007 together for mining and stacking. ccd006 had two versions but ccd007 only one.
 *   - ccd006-v1 and v2: (define-public (mine (cityName (string-ascii 10)) (amounts (list 200 uint)))
 *   - ccd006-v1 and v2: (define-public (claim-mining-reward (cityName (string-ascii 10)) (claimHeight uint))
 *   - ccd007: (define-public (stack (cityName (string-ascii 10)) (amount uint) (lockPeriod uint))
 *   - ccd007: (define-public (claim-stacking-reward (cityName (string-ascii 10)) (cycleId uint))
 * 4) each city has its own redemption contract and asset ID
 * 5) each set of contracts has its own deployer
 */

export type SupportedCity = 'mia' | 'nyc';

export type SupportedCityConfig = {
  assetId: string;
  redemptionContract: string;
}

export type SupportedContractConfig = {
  contracts: string[];
  functions: string[];
}

export const SUPPORTED_CITIES: Record<SupportedCity, SupportedCityConfig> = {
  mia: {
    assetId: 'miamicoin',
    redemptionContract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-mia',
  },
  nyc: {
    assetId: 'newyorkcitycoin',
    redemptionContract: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc',
  },
};

const LEGACY_FUNCTIONS = [
  'mine-tokens',
  'mine-many',
  'stack-tokens',
  'claim-mining-reward',
  'claim-stacking-reward',
]

// supported contracts by deployer?
// also remove transfer for now?
export const SUPPORTED_CONTRACTS: Record<string, SupportedContractConfig> = {
  'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27': {
    contracts: [
      'miamicoin-core-v1',
    ],
    functions: LEGACY_FUNCTIONS,
  },
  'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5': {
    contracts: [
      'newyorkcitycoin-core-v1',
    ],
    functions: LEGACY_FUNCTIONS,
  },
  'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R': {
    contracts: [
      'miamicoin-core-v2',
    ],
    functions: LEGACY_FUNCTIONS,
  },
  'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11': {
    contracts: [
      'newyorkcitycoin-core-v2',
    ],
    functions: LEGACY_FUNCTIONS,
  },
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH': {
    contracts: [
      'ccd006-citycoin-mining',
      'ccd006-citycoin-mining-v2',
      'ccd007-citycoin-stacking',],
    functions: [
      'mine',
      'stack',
      'claim-mining-reward',
      'claim-stacking-reward',
    ],
  },
};

// another idea to break up by function, will still need parameters too
export const MINING_CONTRACTS: Record<string, SupportedContractConfig> = {
  'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27': {
    contracts: [
      'miamicoin-core-v1',
    ],
    functions: [
      'mine-tokens',
      'mine-many',
      'claim-mining-reward',
    ],
  },
  'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5': {
    contracts: [
      'newyorkcitycoin-core-v1',
    ],
    functions: [
      'mine-tokens',
      'mine-many',
      'claim-mining-reward',
    ],
  },
  'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R': {
    contracts: [
      'miamicoin-core-v2',
    ],
    functions: [
      'mine-tokens',
      'mine-many',
      'claim-mining-reward',
    ],
  },
  'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11': {
    contracts: [
      'newyorkcitycoin-core-v2',
    ],
    functions: [
      'mine-tokens',
      'mine-many',
      'claim-mining-reward',
    ],
  },
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH': {
    contracts: [
      'ccd006-citycoin-mining',
      'ccd006-citycoin-mining-v2',
    ],
    functions: [
      'mine',
      'claim-mining-reward',
    ],
  },
}