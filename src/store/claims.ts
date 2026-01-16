/**
 * Claims Tracking Atoms
 *
 * These atoms compute mining and stacking claim eligibility by:
 * 1. Tracking what was mined/stacked (from user transactions)
 * 2. Tracking what was already claimed (from claim transactions)
 * 3. Computing what's still claimable (difference + eligibility checks)
 */

import { atom } from "jotai";
import { ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom, blockHeightsAtom } from "./stacks";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingTxArgs,
  isValidStackingClaimTxArgs,
} from "../utilities/transactions";
import {
  CityName,
  Version,
  CITY_CONFIG,
  findContractInfo,
  getBlockCycle,
  isMiningClaimEligible,
  isStackingClaimEligible,
  getAllMiningFunctions,
  getAllMiningClaimFunctions,
  getAllStackingFunctions,
  getAllStackingClaimFunctions,
} from "../config/city-config";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Mining entry status based on transaction history.
 *
 * Note: "unverified" means the block is matured but needs on-chain verification
 * to determine if the user won. User must trigger verification manually.
 */
export type MiningStatus =
  | "pending"      // Not yet matured (< 100 blocks)
  | "unverified"   // Matured, needs verification (user must trigger)
  | "claimable"    // Verified: won, not yet claimed
  | "claimed"      // Won and claimed (from transaction history)
  | "not-won"      // Verified: didn't win lottery (or failed claim attempt)
  | "error";       // Verification failed

/**
 * Stacking entry status based on transaction history.
 *
 * Note: "unverified" means the cycle is complete but needs on-chain verification
 * to determine if there's a reward. User must trigger verification manually.
 */
export type StackingStatus =
  | "locked"       // Cycle not yet complete
  | "unverified"   // Cycle complete, needs verification
  | "claimable"    // Verified: has reward to claim
  | "claimed"      // Already claimed (from transaction history)
  | "no-reward"    // Verified: no reward available
  | "unavailable"; // Failed claim attempt

export interface MiningEntry {
  txId: string;
  block: number;
  city: CityName;
  version: Version;
  contractId: string;
  functionName: string;
  amountUstx: bigint;
  status: MiningStatus;
  claimTxId?: string;
}

export interface StackingEntry {
  txId: string;
  cycle: number;
  city: CityName;
  version: Version;
  contractId: string;
  functionName: string;
  amountTokens: bigint;
  status: StackingStatus;
  claimTxId?: string;
}

// =============================================================================
// HELPER: Extract city/version from contract and decoded args
// =============================================================================

/**
 * Determine city and version from contract ID and decoded transaction args.
 *
 * For legacy contracts (legacyV1, legacyV2): contract uniquely identifies the city
 * For DAO contracts (daoV1, daoV2): contract is shared, city comes from function args
 */
function getCityVersionFromContractAndArgs(
  contractId: string,
  decoded: { cityName?: string } | null
): { city: CityName; version: Version } | undefined {
  const info = findContractInfo(contractId);
  if (!info) return undefined;
  if (info.module !== "mining" && info.module !== "stacking" && info.module !== "stacking-claim") {
    return undefined;
  }

  // For DAO versions, the contract is shared between cities
  // We need to use the cityName from the decoded function args
  if (info.version === "daoV1" || info.version === "daoV2") {
    if (decoded?.cityName) {
      const cityName = decoded.cityName.toLowerCase();
      if (cityName === "mia" || cityName === "nyc") {
        return { city: cityName as CityName, version: info.version };
      }
    }
    // If no cityName in args, we can't determine the city for DAO contracts
    // This shouldn't happen for valid DAO transactions
    return undefined;
  }

  // For legacy versions, contract uniquely identifies the city
  return { city: info.city, version: info.version };
}

// =============================================================================
// MINING ENTRIES ATOM
// Tracks all blocks user has mined across all cities/versions
// =============================================================================

export const miningEntriesAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const currentBlock = get(blockHeightsAtom)?.stx ?? 0;
  const entries: MiningEntry[] = [];

  const miningFunctions = getAllMiningFunctions();
  const claimFunctions = getAllMiningClaimFunctions();

  // First pass: collect all mined blocks
  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;
    if (tx.tx_status !== "success") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!miningFunctions.includes(functionName)) continue;

    // Decode first to get cityName for DAO contracts
    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidMiningTxArgs(decoded)) continue;

    const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
    if (!cityVersion) continue;

    const { city, version } = cityVersion;
    const numBlocks = decoded.amountsUstx.length;

    for (let i = 0; i < numBlocks; i++) {
      const block = tx.block_height + i;
      const amountUstx = decoded.amountsUstx[i];

      entries.push({
        txId: tx.tx_id,
        block,
        city,
        version,
        contractId,
        functionName,
        amountUstx,
        // Matured blocks start as "unverified" - user must trigger verification
        status: isMiningClaimEligible(block, currentBlock) ? "unverified" : "pending",
      });
    }
  }

  // Second pass: mark claimed and failed blocks
  const claimedBlocks = new Map<string, string>(); // "city-block" -> claimTxId
  const failedBlocks = new Map<string, string>(); // "city-block" -> failedTxId

  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!claimFunctions.includes(functionName)) continue;

    // Decode first to get cityName for DAO contracts
    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidMiningClaimTxArgs(decoded)) continue;

    const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
    if (!cityVersion) continue;

    const block = Number(decoded.minerBlockHeight);
    const key = `${cityVersion.city}-${block}`;

    if (tx.tx_status === "success") {
      claimedBlocks.set(key, tx.tx_id);
    } else if (tx.tx_status === "abort_by_response") {
      // Failed claim - user didn't win lottery or other contract error
      failedBlocks.set(key, tx.tx_id);
    }
  }

  // Update entries with claim status
  for (const entry of entries) {
    const key = `${entry.city}-${entry.block}`;
    const claimTxId = claimedBlocks.get(key);
    const failedTxId = failedBlocks.get(key);

    if (claimTxId) {
      entry.status = "claimed";
      entry.claimTxId = claimTxId;
    } else if (failedTxId) {
      // Failed claim attempt = didn't win the lottery
      entry.status = "not-won";
      entry.claimTxId = failedTxId;
    }
  }

  return entries;
});

// =============================================================================
// MINING VERIFICATION INTEGRATION
// Uses the verification cache from store/verification.ts
// =============================================================================

import { verificationCacheAtom, VerificationStatus } from "./verification";

/**
 * Helper to create cache key matching verification.ts format
 */
function createVerificationKey(
  city: CityName,
  version: Version,
  type: "mining" | "stacking",
  id: number
): string {
  return `${city}-${version}-${type}-${id}`;
}

/**
 * Map verification status to mining status
 */
function mapVerificationToMiningStatus(
  verificationStatus: VerificationStatus
): MiningStatus {
  switch (verificationStatus) {
    case "claimable":
      return "claimable";
    case "not-won":
    case "claimed":
      return verificationStatus;
    case "error":
      return "error";
    case "verifying":
      return "unverified"; // Still show as unverified while checking
    case "unverified":
    case "no-reward":
    default:
      return "unverified";
  }
}

/**
 * Map verification status to stacking status
 */
function mapVerificationToStackingStatus(
  verificationStatus: VerificationStatus
): StackingStatus {
  switch (verificationStatus) {
    case "claimable":
      return "claimable";
    case "claimed":
      return "claimed";
    case "no-reward":
      return "no-reward";
    case "error":
      return "unavailable";
    case "verifying":
      return "unverified"; // Still show as unverified while checking
    case "unverified":
    case "not-won":
    default:
      return "unverified";
  }
}

/**
 * Combines base mining entries with verification results from cache.
 *
 * Priority:
 * 1. Transaction history (claimed/not-won from claim tx)
 * 2. Verification cache (from manual verification)
 * 3. Base status (pending/unverified)
 */
export const verifiedMiningEntriesAtom = atom((get) => {
  const baseEntries = get(miningEntriesAtom);
  const verificationCache = get(verificationCacheAtom);

  return baseEntries.map((entry) => {
    // If already claimed/not-won from transaction history, use that
    if (entry.status === "claimed" || entry.status === "not-won") {
      return entry;
    }

    // If still pending (not matured), keep as pending
    if (entry.status === "pending") {
      return entry;
    }

    // For "unverified" entries, look up verification cache
    const key = createVerificationKey(entry.city, entry.version, "mining", entry.block);
    const cachedResult = verificationCache[key];

    if (cachedResult) {
      return { ...entry, status: mapVerificationToMiningStatus(cachedResult.status) };
    }

    // No verification result yet, keep as "unverified"
    return entry;
  });
});

/**
 * Entries that need verification (status = "unverified" and not in cache)
 */
export const miningEntriesNeedingVerificationAtom = atom((get) => {
  const entries = get(miningEntriesAtom);
  const verificationCache = get(verificationCacheAtom);

  return entries.filter((entry) => {
    if (entry.status !== "unverified") return false;
    const key = createVerificationKey(entry.city, entry.version, "mining", entry.block);
    return !verificationCache[key];
  });
});

// =============================================================================
// STACKING ENTRIES ATOM
// Tracks all cycles user has stacked across all cities/versions
// =============================================================================

export const stackingEntriesAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const currentBlock = get(blockHeightsAtom)?.stx ?? 0;
  const entries: StackingEntry[] = [];

  const stackingFunctions = getAllStackingFunctions();
  const claimFunctions = getAllStackingClaimFunctions();

  // First pass: collect all stacked cycles
  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;
    if (tx.tx_status !== "success") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!stackingFunctions.includes(functionName)) continue;

    // Decode first to get cityName for DAO contracts
    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidStackingTxArgs(decoded)) continue;

    const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
    if (!cityVersion) continue;

    const { city, version } = cityVersion;
    const lockPeriod = Number(decoded.lockPeriod);
    const amountTokens = decoded.amountToken;

    // Calculate start cycle based on block height and version's genesis
    const startCycle = getBlockCycle(city, version, tx.block_height);

    // Get version's endCycle to cap entries at valid range
    const { endCycle } = CITY_CONFIG[city][version].stacking;

    for (let i = 0; i < lockPeriod; i++) {
      const cycle = startCycle + i;

      // Skip cycles beyond this version's valid range
      if (endCycle !== undefined && cycle > endCycle) {
        continue;
      }

      entries.push({
        txId: tx.tx_id,
        cycle,
        city,
        version,
        contractId,
        functionName,
        amountTokens,
        // Completed cycles start as "unverified" - user must trigger verification
        status: isStackingClaimEligible(city, version, cycle, currentBlock)
          ? "unverified"
          : "locked",
      });
    }
  }

  // Second pass: mark claimed and failed cycles
  const claimedCycles = new Map<string, string>(); // "city-cycle" -> claimTxId
  const failedCycles = new Map<string, string>(); // "city-cycle" -> failedTxId

  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!claimFunctions.includes(functionName)) continue;

    // Decode first to get cityName for DAO contracts
    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidStackingClaimTxArgs(decoded)) continue;

    const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
    if (!cityVersion) continue;

    const cycle = Number(decoded.rewardCycle);
    const key = `${cityVersion.city}-${cycle}`;

    if (tx.tx_status === "success") {
      claimedCycles.set(key, tx.tx_id);
    } else if (tx.tx_status === "abort_by_response") {
      // Failed claim
      failedCycles.set(key, tx.tx_id);
    }
  }

  // Update entries with claim status
  for (const entry of entries) {
    const key = `${entry.city}-${entry.cycle}`;
    const claimTxId = claimedCycles.get(key);
    const failedTxId = failedCycles.get(key);

    if (claimTxId) {
      entry.status = "claimed";
      entry.claimTxId = claimTxId;
    } else if (failedTxId) {
      entry.status = "unavailable";
      entry.claimTxId = failedTxId;
    }
  }

  return entries;
});

// =============================================================================
// STACKING VERIFICATION INTEGRATION
// Uses the verification cache from store/verification.ts
// =============================================================================

/**
 * Combines base stacking entries with verification results from cache.
 *
 * Priority:
 * 1. Transaction history (claimed/unavailable from claim tx)
 * 2. Verification cache (from manual verification)
 * 3. Base status (locked/unverified)
 */
export const verifiedStackingEntriesAtom = atom((get) => {
  const baseEntries = get(stackingEntriesAtom);
  const verificationCache = get(verificationCacheAtom);

  return baseEntries.map((entry) => {
    // If already claimed/unavailable from transaction history, use that
    if (entry.status === "claimed" || entry.status === "unavailable") {
      return entry;
    }

    // If still locked (cycle not complete), keep as locked
    if (entry.status === "locked") {
      return entry;
    }

    // For "unverified" entries, look up verification cache
    const key = createVerificationKey(entry.city, entry.version, "stacking", entry.cycle);
    const cachedResult = verificationCache[key];

    if (cachedResult) {
      return { ...entry, status: mapVerificationToStackingStatus(cachedResult.status) };
    }

    // No verification result yet, keep as "unverified"
    return entry;
  });
});

/**
 * Stacking entries that need verification (status = "unverified" and not in cache)
 */
export const stackingEntriesNeedingVerificationAtom = atom((get) => {
  const entries = get(stackingEntriesAtom);
  const verificationCache = get(verificationCacheAtom);

  return entries.filter((entry) => {
    if (entry.status !== "unverified") return false;
    const key = createVerificationKey(entry.city, entry.version, "stacking", entry.cycle);
    return !verificationCache[key];
  });
});

// =============================================================================
// CITY-FILTERED ATOMS
// =============================================================================

export const miaMiningEntriesAtom = atom((get) => {
  const entries = get(verifiedMiningEntriesAtom);
  return entries.filter((e) => e.city === "mia");
});

export const nycMiningEntriesAtom = atom((get) => {
  const entries = get(verifiedMiningEntriesAtom);
  return entries.filter((e) => e.city === "nyc");
});

export const miaStackingEntriesAtom = atom((get) => {
  const entries = get(verifiedStackingEntriesAtom);
  return entries.filter((e) => e.city === "mia");
});

export const nycStackingEntriesAtom = atom((get) => {
  const entries = get(verifiedStackingEntriesAtom);
  return entries.filter((e) => e.city === "nyc");
});

// =============================================================================
// UNCLAIMED/CLAIMABLE ATOMS
// =============================================================================

export const unclaimedMiningAtom = atom((get) => {
  const entries = get(miningEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

export const unclaimedStackingAtom = atom((get) => {
  const entries = get(stackingEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

export const miaUnclaimedMiningAtom = atom((get) => {
  const entries = get(miaMiningEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

export const nycUnclaimedMiningAtom = atom((get) => {
  const entries = get(nycMiningEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

export const miaUnclaimedStackingAtom = atom((get) => {
  const entries = get(miaStackingEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

export const nycUnclaimedStackingAtom = atom((get) => {
  const entries = get(nycStackingEntriesAtom);
  return entries.filter((e) => e.status === "claimable");
});

// =============================================================================
// SUMMARY ATOMS
// =============================================================================

export interface CitySummary {
  // Mining
  miningTotal: number;
  miningClaimed: number;
  miningClaimable: number;
  miningPending: number;
  miningUnverified: number;
  miningNotWon: number;
  miningError: number;
  // Stacking
  stackingTotal: number;
  stackingClaimed: number;
  stackingClaimable: number;
  stackingLocked: number;
  stackingUnverified: number;
  stackingNoReward: number;
  stackingUnavailable: number;
}

export interface ClaimsSummary {
  mia: CitySummary;
  nyc: CitySummary;
}

export const claimsSummaryAtom = atom<ClaimsSummary>((get) => {
  const miningEntries = get(verifiedMiningEntriesAtom);
  const stackingEntries = get(verifiedStackingEntriesAtom);

  const summarize = (city: CityName): CitySummary => {
    const mining = miningEntries.filter((e) => e.city === city);
    const stacking = stackingEntries.filter((e) => e.city === city);

    return {
      // Mining
      miningTotal: mining.length,
      miningClaimed: mining.filter((e) => e.status === "claimed").length,
      miningClaimable: mining.filter((e) => e.status === "claimable").length,
      miningPending: mining.filter((e) => e.status === "pending").length,
      miningUnverified: mining.filter((e) => e.status === "unverified").length,
      miningNotWon: mining.filter((e) => e.status === "not-won").length,
      miningError: mining.filter((e) => e.status === "error").length,
      // Stacking
      stackingTotal: stacking.length,
      stackingClaimed: stacking.filter((e) => e.status === "claimed").length,
      stackingClaimable: stacking.filter((e) => e.status === "claimable").length,
      stackingLocked: stacking.filter((e) => e.status === "locked").length,
      stackingUnverified: stacking.filter((e) => e.status === "unverified").length,
      stackingNoReward: stacking.filter((e) => e.status === "no-reward").length,
      stackingUnavailable: stacking.filter((e) => e.status === "unavailable").length,
    };
  };

  return {
    mia: summarize("mia"),
    nyc: summarize("nyc"),
  };
});
