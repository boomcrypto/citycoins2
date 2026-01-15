/**
 * CityCoins Protocol Configuration
 *
 * This file contains all contract addresses, activation blocks, and protocol
 * parameters for MIA and NYC across all versions (legacyV1, legacyV2, daoV1, daoV2).
 *
 * Key concepts:
 * - Each city went through multiple contract upgrades (CCIPs)
 * - Mining and stacking have different activation windows per version
 * - Cycle length is always 2100 blocks
 * - Genesis block determines cycle 1 for each version
 */

// =============================================================================
// TYPES
// =============================================================================

export type CityName = 'mia' | 'nyc';
export type Version = 'legacyV1' | 'legacyV2' | 'daoV1' | 'daoV2';

export interface TokenConfig {
  deployer: string;
  contractName: string;
  contractId: string;
  activationBlock: number;
  displayName: string;
  tokenName: string;
  symbol: string;
  decimals: number;
  logo: string;
}

export interface MiningConfig {
  deployer: string;
  contractName: string;
  contractId: string;
  functions: {
    mine: string[];
    claim: string[];
  };
  activationBlock: number;
  shutdownBlock?: number;
  genesisBlock: number;
  cycleLength: number;
}

export interface StackingConfig {
  deployer: string;
  contractName: string;
  contractId: string;
  claimContractId: string;
  functions: {
    stack: string[];
    claim: string[];
  };
  startCycle: number;
  endCycle?: number;
  genesisBlock: number;
  cycleLength: number;
}

export interface RedemptionConfig {
  deployer: string;
  contractName: string;
  contractId: string;
  functions: string[];
}

export interface VersionConfig {
  mining: MiningConfig;
  stacking: StackingConfig;
  token: TokenConfig;
  redemption: RedemptionConfig;
}

export interface CityInfo {
  name: CityName;
  displayName: string;
  symbol: string;
  cityId: number;
  versions: Version[];
  currentVersion: Version;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const VERSIONS: Version[] = ['legacyV1', 'legacyV2', 'daoV1', 'daoV2'];
export const CYCLE_LENGTH = 2100;
export const MINING_CLAIM_MATURITY = 100; // blocks after mining before claim eligible

export const CITY_IDS: Record<CityName, number> = {
  mia: 1,
  nyc: 2,
};

// =============================================================================
// CITY INFO
// =============================================================================

export const CITY_INFO: Record<CityName, CityInfo> = {
  mia: {
    name: 'mia',
    displayName: 'Miami',
    symbol: 'MIA',
    cityId: 1,
    versions: VERSIONS,
    currentVersion: 'daoV2',
  },
  nyc: {
    name: 'nyc',
    displayName: 'New York City',
    symbol: 'NYC',
    cityId: 2,
    versions: VERSIONS,
    currentVersion: 'daoV2',
  },
};

// =============================================================================
// TOKEN CONFIGURATIONS
// =============================================================================

const MIA_TOKEN_V1: TokenConfig = {
  deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
  contractName: 'miamicoin-token',
  contractId: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token',
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
};

const MIA_TOKEN_V2: TokenConfig = {
  deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
  contractName: 'miamicoin-token-v2',
  contractId: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2',
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
};

const NYC_TOKEN_V1: TokenConfig = {
  deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
  contractName: 'newyorkcitycoin-token',
  contractId: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token',
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
};

const NYC_TOKEN_V2: TokenConfig = {
  deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
  contractName: 'newyorkcitycoin-token-v2',
  contractId: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2',
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
};

// =============================================================================
// MIA VERSION CONFIGURATIONS
// =============================================================================

const MIA_LEGACY_V1: VersionConfig = {
  mining: {
    deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
    contractName: 'miamicoin-core-v1',
    contractId: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
    functions: {
      mine: ['mine-tokens', 'mine-many'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 24497,
    shutdownBlock: 58917,
    genesisBlock: 24497,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
    contractName: 'miamicoin-core-v1',
    contractId: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
    claimContractId: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
    functions: {
      stack: ['stack-tokens'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 1,
    endCycle: 16,
    genesisBlock: 24497,
    cycleLength: CYCLE_LENGTH,
  },
  token: MIA_TOKEN_V1,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd012-redemption-mia',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-mia',
    functions: ['redeem-mia'],
  },
};

const MIA_LEGACY_V2: VersionConfig = {
  mining: {
    deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
    contractName: 'miamicoin-core-v2',
    contractId: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
    functions: {
      mine: ['mine-tokens', 'mine-many'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 58921,
    shutdownBlock: 96779,
    genesisBlock: 58921,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
    contractName: 'miamicoin-core-v2',
    contractId: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
    claimContractId: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
    functions: {
      stack: ['stack-tokens'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 17,
    endCycle: 34,
    genesisBlock: 58921,
    cycleLength: CYCLE_LENGTH,
  },
  token: MIA_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd012-redemption-mia',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-mia',
    functions: ['redeem-mia'],
  },
};

const MIA_DAO_V1: VersionConfig = {
  mining: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd006-citycoin-mining',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining',
    functions: {
      mine: ['mine'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 96779,
    shutdownBlock: 107389,
    genesisBlock: 96779,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd007-citycoin-stacking',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    claimContractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-stacking',
    functions: {
      stack: ['stack'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 35,
    endCycle: 53,
    genesisBlock: 96779,
    cycleLength: CYCLE_LENGTH,
  },
  token: MIA_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd012-redemption-mia',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-mia',
    functions: ['redeem-mia'],
  },
};

const MIA_DAO_V2: VersionConfig = {
  mining: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd006-citycoin-mining-v2',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    functions: {
      mine: ['mine'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 107389,
    shutdownBlock: undefined,
    genesisBlock: 107389,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd007-citycoin-stacking',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    claimContractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-stacking',
    functions: {
      stack: ['stack'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 54,
    endCycle: undefined,
    genesisBlock: 107389,
    cycleLength: CYCLE_LENGTH,
  },
  token: MIA_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd012-redemption-mia',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-mia',
    functions: ['redeem-mia'],
  },
};

// =============================================================================
// NYC VERSION CONFIGURATIONS
// =============================================================================

const NYC_LEGACY_V1: VersionConfig = {
  mining: {
    deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
    contractName: 'newyorkcitycoin-core-v1',
    contractId: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
    functions: {
      mine: ['mine-tokens', 'mine-many'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 37449,
    shutdownBlock: 58922,
    genesisBlock: 37449,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
    contractName: 'newyorkcitycoin-core-v1',
    contractId: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
    claimContractId: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
    functions: {
      stack: ['stack-tokens'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 1,
    endCycle: 10,
    genesisBlock: 37449,
    cycleLength: CYCLE_LENGTH,
  },
  token: NYC_TOKEN_V1,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd013-redemption-nyc',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-nyc',
    functions: ['redeem-nyc'],
  },
};

const NYC_LEGACY_V2: VersionConfig = {
  mining: {
    deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
    contractName: 'newyorkcitycoin-core-v2',
    contractId: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
    functions: {
      mine: ['mine-tokens', 'mine-many'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 58925,
    shutdownBlock: 96779,
    genesisBlock: 58925,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
    contractName: 'newyorkcitycoin-core-v2',
    contractId: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
    claimContractId: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
    functions: {
      stack: ['stack-tokens'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 11,
    endCycle: 28,
    genesisBlock: 58925,
    cycleLength: CYCLE_LENGTH,
  },
  token: NYC_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd013-redemption-nyc',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-nyc',
    functions: ['redeem-nyc'],
  },
};

const NYC_DAO_V1: VersionConfig = {
  mining: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd006-citycoin-mining',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining',
    functions: {
      mine: ['mine'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 96779,
    shutdownBlock: 107389,
    genesisBlock: 96779,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd007-citycoin-stacking',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    claimContractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-nyc-stacking',
    functions: {
      stack: ['stack'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 29,
    endCycle: 53,
    genesisBlock: 96779,
    cycleLength: CYCLE_LENGTH,
  },
  token: NYC_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd013-redemption-nyc',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-nyc',
    functions: ['redeem-nyc'],
  },
};

const NYC_DAO_V2: VersionConfig = {
  mining: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd006-citycoin-mining-v2',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2',
    functions: {
      mine: ['mine'],
      claim: ['claim-mining-reward'],
    },
    activationBlock: 107389,
    shutdownBlock: undefined,
    genesisBlock: 107389,
    cycleLength: CYCLE_LENGTH,
  },
  stacking: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd007-citycoin-stacking',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking',
    claimContractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-nyc-stacking',
    functions: {
      stack: ['stack'],
      claim: ['claim-stacking-reward'],
    },
    startCycle: 54,
    endCycle: undefined,
    genesisBlock: 107389,
    cycleLength: CYCLE_LENGTH,
  },
  token: NYC_TOKEN_V2,
  redemption: {
    deployer: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
    contractName: 'ccd013-redemption-nyc',
    contractId: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-nyc',
    functions: ['redeem-nyc'],
  },
};

// =============================================================================
// COMBINED CONFIGURATIONS
// =============================================================================

export const CITY_CONFIG: Record<CityName, Record<Version, VersionConfig>> = {
  mia: {
    legacyV1: MIA_LEGACY_V1,
    legacyV2: MIA_LEGACY_V2,
    daoV1: MIA_DAO_V1,
    daoV2: MIA_DAO_V2,
  },
  nyc: {
    legacyV1: NYC_LEGACY_V1,
    legacyV2: NYC_LEGACY_V2,
    daoV1: NYC_DAO_V1,
    daoV2: NYC_DAO_V2,
  },
};

// =============================================================================
// VOTING CONTRACTS
// =============================================================================

export const VOTING_CONTRACTS: Record<string, string[]> = {
  'SP34FHX44NK9KZ8KJC08WR2NHP8NEGFTTT7MTH7XD.citycoins-vote-v1': ['vote-on-proposal'],
  'SP119FQPVQ39AKVMC0CN3Q1ZN3ZMCGMBR52ZS5K6E.citycoins-vote-v2': ['vote-on-proposal'],
  'SP5X6BFPYXTZ8C63EYYPA02X2VQTG4V43XNPGAPF.citycoins-vote-v3': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2': ['vote-on-proposal'],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown': [
    'vote-on-proposal',
  ],
};

// =============================================================================
// VERSION DETECTION HELPERS
// =============================================================================

/**
 * Get the contract version for a given block height (for mining)
 * Returns the version that was active at that block, or undefined if before activation
 */
export function getVersionByBlock(city: CityName, block: number): Version | undefined {
  for (const version of VERSIONS) {
    const config = CITY_CONFIG[city][version].mining;
    const { activationBlock, shutdownBlock } = config;

    if (block < activationBlock) {
      continue;
    }

    // If no shutdown, this version handles all blocks from activation onwards
    if (shutdownBlock === undefined) {
      return version;
    }

    // Block is within this version's active range
    if (block <= shutdownBlock) {
      return version;
    }
  }
  return undefined;
}

/**
 * Get the contract version for a given stacking cycle
 * Returns the version that handles that cycle, or undefined if invalid
 */
export function getVersionByCycle(city: CityName, cycle: number): Version | undefined {
  for (const version of VERSIONS) {
    const config = CITY_CONFIG[city][version].stacking;
    const { startCycle, endCycle } = config;

    if (cycle < startCycle) {
      continue;
    }

    // If no end cycle, this version handles all cycles from start onwards
    if (endCycle === undefined) {
      return version;
    }

    // Cycle is within this version's range
    if (cycle <= endCycle) {
      return version;
    }
  }
  return undefined;
}

/**
 * Get version config for a city
 */
export function getCityConfig(city: CityName, version?: Version): VersionConfig {
  const v = version ?? CITY_INFO[city].currentVersion;
  return CITY_CONFIG[city][v];
}

/**
 * Get city info
 */
export function getCityInfo(city: CityName): CityInfo {
  return CITY_INFO[city];
}

// =============================================================================
// CYCLE/BLOCK CALCULATION HELPERS
// =============================================================================

/**
 * Calculate which cycle a block height falls into for a given version
 */
export function getBlockCycle(city: CityName, version: Version, blockHeight: number): number {
  const { genesisBlock, cycleLength } = CITY_CONFIG[city][version].stacking;
  if (blockHeight < genesisBlock) return 0;
  return Math.floor((blockHeight - genesisBlock) / cycleLength) + 1;
}

/**
 * Calculate the first block of a cycle for a given version
 */
export function getCycleFirstBlock(city: CityName, version: Version, cycle: number): number {
  const { genesisBlock, cycleLength } = CITY_CONFIG[city][version].stacking;
  return genesisBlock + (cycle - 1) * cycleLength;
}

/**
 * Check if a block is eligible for mining claim (matured)
 */
export function isMiningClaimEligible(minedBlock: number, currentBlock: number): boolean {
  return currentBlock >= minedBlock + MINING_CLAIM_MATURITY;
}

/**
 * Check if a stacking cycle is eligible for claim
 * Stacking rewards are claimable after the cycle ends
 */
export function isStackingClaimEligible(
  city: CityName,
  version: Version,
  cycle: number,
  currentBlock: number
): boolean {
  const cycleEndBlock = getCycleFirstBlock(city, version, cycle + 1);
  return currentBlock >= cycleEndBlock;
}

// =============================================================================
// CONTRACT LOOKUP HELPERS
// =============================================================================

/**
 * Find which city and version a contract belongs to
 */
export function findContractInfo(
  contractId: string
): { city: CityName; version: Version; module: 'mining' | 'stacking' | 'token' } | undefined {
  for (const city of ['mia', 'nyc'] as CityName[]) {
    for (const version of VERSIONS) {
      const config = CITY_CONFIG[city][version];

      if (config.mining.contractId === contractId) {
        return { city, version, module: 'mining' };
      }
      if (config.stacking.contractId === contractId) {
        return { city, version, module: 'stacking' };
      }
      if (config.token.contractId === contractId) {
        return { city, version, module: 'token' };
      }
    }
  }
  return undefined;
}

/**
 * Get all mining contract IDs for a city (across all versions)
 */
export function getAllMiningContracts(city: CityName): string[] {
  return VERSIONS.map((v) => CITY_CONFIG[city][v].mining.contractId);
}

/**
 * Get all stacking contract IDs for a city (across all versions)
 */
export function getAllStackingContracts(city: CityName): string[] {
  return VERSIONS.map((v) => CITY_CONFIG[city][v].stacking.contractId);
}

/**
 * Get all mining function names (across all versions)
 */
export function getAllMiningFunctions(): string[] {
  return ['mine-tokens', 'mine-many', 'mine'];
}

/**
 * Get all mining claim function names
 */
export function getAllMiningClaimFunctions(): string[] {
  return ['claim-mining-reward'];
}

/**
 * Get all stacking function names (across all versions)
 */
export function getAllStackingFunctions(): string[] {
  return ['stack-tokens', 'stack'];
}

/**
 * Get all stacking claim function names
 */
export function getAllStackingClaimFunctions(): string[] {
  return ['claim-stacking-reward'];
}

// =============================================================================
// BACKWARD COMPATIBILITY - matches old contracts.ts interface
// =============================================================================

export type CoinType = CityName;

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
  miningV1?: string;
  miningV2?: string;
  stackingV2?: string;
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
      core: MIA_LEGACY_V1.mining.contractId,
      token: MIA_TOKEN_V1.contractId,
    },
    v2: {
      core: MIA_LEGACY_V2.mining.contractId,
      token: MIA_TOKEN_V2.contractId,
    },
    miningV1: MIA_DAO_V1.mining.contractId,
    miningV2: MIA_DAO_V2.mining.contractId,
    stackingV2: MIA_DAO_V2.stacking.contractId,
    redemption: MIA_DAO_V2.redemption.contractId,
    functions: {
      mining: getAllMiningFunctions(),
      miningClaims: getAllMiningClaimFunctions(),
      stacking: getAllStackingFunctions(),
      stackingClaims: getAllStackingClaimFunctions(),
      transfer: ['transfer'],
    },
  },
  nyc: {
    assetId: 'newyorkcitycoin',
    v1: {
      core: NYC_LEGACY_V1.mining.contractId,
      token: NYC_TOKEN_V1.contractId,
    },
    v2: {
      core: NYC_LEGACY_V2.mining.contractId,
      token: NYC_TOKEN_V2.contractId,
    },
    miningV1: NYC_DAO_V1.mining.contractId,
    miningV2: NYC_DAO_V2.mining.contractId,
    stackingV2: NYC_DAO_V2.stacking.contractId,
    redemption: NYC_DAO_V2.redemption.contractId,
    functions: {
      mining: getAllMiningFunctions(),
      miningClaims: getAllMiningClaimFunctions(),
      stacking: getAllStackingFunctions(),
      stackingClaims: getAllStackingClaimFunctions(),
      transfer: ['transfer'],
    },
  },
};
