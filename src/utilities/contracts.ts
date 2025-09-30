export type City = 'mia' | 'nyc';
export type Version = 'legacyV1' | 'legacyV2' | 'daoV1' | 'daoV2';
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

import { CITY_CONFIG, CITY_IDS, VERSIONS } from '../config/city-config';

type ContractId = `${string}.${string}`;

type Entry = {
  city: City;
  version: Version;
  module: Module;
  contract: ContractId; // fully-qualified (address.name)
  functions: readonly string[];
  readonlyFunctions?: {
    miningCheck?: string; // e.g., 'is-block-winner' or 'can-claim-mining-reward'
    stackingCheck?: string; // e.g., 'get-stacker' or 'get-stacker-at-cycle'
    getUserId?: string; // e.g., 'get-user-id'
  };
};

// Dynamic REGISTRY builder using config
function buildRegistry(): Entry[] {
  const registry: Entry[] = [];

  // Helper to add readonly functions based on module
  const addReadonlyFunctions = (module: Module): any => {
    const funcs: any = {};
    if (module === 'core') {
      funcs.miningCheck = 'is-block-winner';
      funcs.stackingCheck = 'get-stacker-at-cycle';
      funcs.getUserId = 'get-user-id';
    } else if (module === 'mining') {
      funcs.miningCheck = 'is-block-winner';
    } else if (module === 'stacking') {
      funcs.stackingCheck = 'get-stacker';
    }
    // token has no readonly
    return Object.keys(funcs).length > 0 ? funcs : undefined;
  };

  // Loop over cities and versions
  (['mia', 'nyc'] as City[]).forEach((city) => {
    VERSIONS.forEach((version) => {
      const config = CITY_CONFIG[city][version];

      // Core: only for legacyV1 and legacyV2
      if (version === 'legacyV1' || version === 'legacyV2') {
        const coreDeployer = config.mining.deployer; // reuse mining deployer for core
        const coreContractName = city === 'mia' 
          ? `miamicoin-core-${version === 'legacyV1' ? 'v1' : 'v2'}`
          : `newyorkcitycoin-core-${version === 'legacyV1' ? 'v1' : 'v2'}`;
        const coreContract = `${coreDeployer}.${coreContractName}`;
        registry.push({
          city,
          version,
          module: 'core' as const,
          contract: coreContract,
          functions: CORE_FUNCTIONS,
          readonlyFunctions: addReadonlyFunctions('core'),
        });
      }

      // Mining: for all versions (core for legacy, ccd006 for dao)
      let miningContract: string;
      if (version === 'legacyV1' || version === 'legacyV2') {
        // For legacy, mining is in core, but we already added core above; skip or add separately if needed
        // Note: For legacy, we use core entry for mining functions
      } else {
        // For dao, use ccd006
        const miningDeployer = config.mining.deployer;
        const miningContractName = config.mining.contractName;
        miningContract = `${miningDeployer}.${miningContractName}`;
        registry.push({
          city,
          version,
          module: 'mining' as const,
          contract: miningContract,
          functions: CCD006_FUNCTIONS,
          readonlyFunctions: addReadonlyFunctions('mining'),
        });
      }

      // Stacking: for all versions (core for legacy, ccd007 for dao)
      let stackingContract: string;
      if (version === 'legacyV1' || version === 'legacyV2') {
        // For legacy, stacking is in core, already added
      } else {
        // For dao, use ccd007
        const stackingDeployer = config.stacking.deployer;
        const stackingContractName = config.stacking.contractName;
        stackingContract = `${stackingDeployer}.${stackingContractName}`;
        registry.push({
          city,
          version,
          module: 'stacking' as const,
          contract: stackingContract,
          functions: CCD007_FUNCTIONS,
          readonlyFunctions: addReadonlyFunctions('stacking'),
        });
      }

      // Token: for all versions
      const tokenDeployer = config.token.deployer;
      const tokenContractName = config.token.contractName;
      const tokenContract = `${tokenDeployer}.${tokenContractName}`;
      registry.push({
        city,
        version,
        module: 'token' as const,
        contract: tokenContract,
        functions: TOKEN_FUNCTIONS,
      });
    });
  });

  return registry;
}

export const REGISTRY = buildRegistry();

export const USER_REGISTRY_CONTRACT = 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd003-user-registry' as const;
export const USER_REGISTRY_FUNCTIONS = ['get-user-id'] as const;

export const CITY_ID_MAP = CITY_IDS;

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
