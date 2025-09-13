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
