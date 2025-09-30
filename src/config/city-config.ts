
/////////////////////////
// CITY INFO
/////////////////////////

export const VERSIONS = ['legacyV1', 'legacyV2', 'daoV1', 'daoV2'];

const MIA_INFO = {
  name: 'mia',
  displayName: 'Miami',
  symbol: 'MIA',
  textColor: 'text-dark',
  versions: VERSIONS,
  currentVersion: 'daoV2',
};

const NYC_INFO = {
  name: 'nyc',
  displayName: 'New York City',
  symbol: 'NYC',
  textColor: 'text-dark',
  versions: VERSIONS,
  currentVersion: 'daoV2',
};

export const CITY_INFO = {
  mia: MIA_INFO,
  nyc: NYC_INFO,
};

/////////////////////////
// CITY IDS
/////////////////////////

export const CITY_IDS = {
  mia: 1,
  nyc: 2,
};

/////////////////////////
// CITY CONFIGURATIONS
/////////////////////////

// Token configurations
const miaTokenV1 = {
  deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
  contractName: 'miamicoin-token',
  activated: true,
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
  uri: 'https://cdn.citycoins.co/metadata/miamicoin.json',
};

const miaTokenV2 = {
  deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
  contractName: 'miamicoin-token-v2',
  activated: true,
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
  uri: 'https://cdn.citycoins.co/metadata/miamicoin.json',
};

const nycTokenV1 = {
  deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
  contractName: 'newyorkcitycoin-token',
  activated: true,
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
  uri: 'https://cdn.citycoins.co/metadata/newyorkcitycoin.json',
};

const nycTokenV2 = {
  deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
  contractName: 'newyorkcitycoin-token-v2',
  activated: true,
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
  uri: 'https://cdn.citycoins.co/metadata/newyorkcitycoin.json',
};

// DAO v1 and v2 configurations
const daoV2 = (city: 'mia' | 'nyc') => {
  const token = city === 'mia' ? miaTokenV2 : nycTokenV2;
  const claimContract = city === 'mia' ? 'ccd002-treasury-mia-stacking' : 'ccd002-treasury-nyc-stacking';
  return {
    mining: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd006-citycoin-mining-v2',
      miningFunction: 'mine',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 107389,
      shutdown: false,
      shutdownBlock: undefined,
      genesisBlock: 107389,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd007-citycoin-stacking',
      stackingFunction: 'stack',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: claimContract,
      startCycle: 54,
      endCycle: undefined,
      genesisBlock: 107389,
      cycleLength: 2100,
    },
    token,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: city === 'mia' ? 'ccd012-redemption-mia' : 'ccd013-redemption-nyc',
      functions: ['redeem-mia', 'redeem-nyc'],
    },
  };
};

const daoV1 = (city: 'mia' | 'nyc') => {
  const token = city === 'mia' ? miaTokenV2 : nycTokenV2;
  const claimContract = city === 'mia' ? 'ccd002-treasury-mia-stacking' : 'ccd002-treasury-nyc-stacking';
  return {
    mining: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd006-citycoin-mining',
      miningFunction: 'mine',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 96779,
      shutdown: true,
      shutdownBlock: 107389,
      genesisBlock: 96779,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd007-citycoin-stacking',
      stackingFunction: 'stack',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: claimContract,
      startCycle: 54,
      endCycle: undefined,
      genesisBlock: 96779,
      cycleLength: 2100,
    },
    token,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: city === 'mia' ? 'ccd012-redemption-mia' : 'ccd013-redemption-nyc',
      functions: ['redeem-mia', 'redeem-nyc'],
    },
  };
};

// MIA configuration
export const MIA_CONFIG = {
  legacyV1: {
    mining: {
      deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
      contractName: 'miamicoin-core-v1',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: false,
      activationBlock: 24497,
      shutdown: true,
      shutdownBlock: 58917,
      genesisBlock: 24497,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
      contractName: 'miamicoin-core-v1',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: 'miamicoin-core-v1',
      startCycle: 1,
      endCycle: 16,
      genesisBlock: 24497,
      cycleLength: 2100,
    },
    token: miaTokenV1,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd012-redemption-mia',
      functions: ['redeem-mia'],
    },
  },
  legacyV2: {
    mining: {
      deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
      contractName: 'miamicoin-core-v2',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 58921,
      shutdown: true,
      shutdownBlock: 96779,
      genesisBlock: 58921,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
      contractName: 'miamicoin-core-v2',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: 'miamicoin-core-v2',
      startCycle: 17,
      endCycle: 34,
      genesisBlock: 58921,
      cycleLength: 2100,
    },
    token: miaTokenV2,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd012-redemption-mia',
      functions: ['redeem-mia'],
    },
  },
  daoV1: daoV1('mia'),
  daoV2: daoV2('mia'),
};

// NYC configuration
export const NYC_CONFIG = {
  legacyV1: {
    mining: {
      deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
      contractName: 'newyorkcitycoin-core-v1',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 37449,
      shutdown: true,
      shutdownBlock: 58922,
      genesisBlock: 37449,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
      contractName: 'newyorkcitycoin-core-v1',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: 'newyorkcitycoin-core-v1',
      startCycle: 1,
      endCycle: 10,
      genesisBlock: 37449,
      cycleLength: 2100,
    },
    token: nycTokenV1,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd013-redemption-nyc',
      functions: ['redeem-nyc'],
    },
  },
  legacyV2: {
    mining: {
      deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
      contractName: 'newyorkcitycoin-core-v2',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 58925,
      shutdown: true,
      shutdownBlock: 96779,
      genesisBlock: 58925,
      cycleLength: 2100,
    },
    stacking: {
      deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
      contractName: 'newyorkcitycoin-core-v2',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      stackingClaimContract: 'newyorkcitycoin-core-v2',
      startCycle: 11,
      endCycle: 28,
      genesisBlock: 58925,
      cycleLength: 2100,
    },
    token: nycTokenV2,
    redemption: {
      deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
      contractName: 'ccd013-redemption-nyc',
      functions: ['redeem-nyc'],
    },
  },
  daoV1: daoV1('nyc'),
  daoV2: daoV2('nyc'),
};

// Combined city configs
export const CITY_CONFIG = {
  mia: MIA_CONFIG,
  nyc: NYC_CONFIG,
};

// Version mapping for legacy to simplified versions
export const VERSION_MAP = {
  legacyV1: 'legacyV1',
  legacyV2: 'legacyV2',
  daoV1: 'daoV1',
  daoV2: 'daoV2',
};

////////////////////
// VERSION HELPERS
////////////////////

// city = currentCity.data
// block = block height for mining claim
export function getVersionByBlock(city: 'mia' | 'nyc', block: number) {
  for (const version of VERSIONS) {
    const activationBlock = CITY_CONFIG[city][version].mining.activationBlock;
    const shutdown = CITY_CONFIG[city][version].mining.shutdown;
    const shutdownBlock = shutdown ? CITY_CONFIG[city][version].mining.shutdownBlock : undefined;
    if (block < activationBlock) {
      return undefined;
    }
    if (shutdown && block <= shutdownBlock) {
      return version;
    }
    if (!shutdown) {
      return version;
    }
  }
}

// city = currentCity.data
// cycle = stacking cycle for stacking claim
export function getVersionByCycle(city: 'mia' | 'nyc', cycle: number) {
  for (const version of VERSIONS) {
    const startCycle = CITY_CONFIG[city][version].stacking.startCycle;
    const endCycle = CITY_CONFIG[city][version].stacking.endCycle;
    if (cycle < startCycle) {
      return undefined;
    }
    if (cycle >= startCycle && endCycle === undefined) {
      return version;
    }
    if (cycle <= endCycle) {
      return version;
    }
  }
}

////////////////////
// CONFIG HELPERS
////////////////////

// city = currentCity.data
// version = getVersion* above or default to latest
export function getCitySettings(city: 'mia' | 'nyc', version?: string) {
  return {
    info: CITY_INFO[city],
    config: version
      ? CITY_CONFIG[city][version]
      : CITY_CONFIG[city][CITY_INFO[city].currentVersion],
  };
}

// city = currentCity.data
// version = getVersion* above or default to latest
export function getCityConfig(city: 'mia' | 'nyc', version?: string) {
  return version ? CITY_CONFIG[city][version] : CITY_CONFIG[city][CITY_INFO[city].currentVersion];
}

// city = currentCity.data
export function getCityInfo(city: 'mia' | 'nyc') {
  return CITY_INFO[city];
}
