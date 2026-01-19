/**
 * Claims Tracking Atoms
 *
 * These atoms compute mining and stacking claim eligibility by:
 * 1. Tracking what was mined/stacked (from user transactions)
 * 2. Tracking what was already claimed (from claim transactions)
 * 3. Computing what's still claimable (difference + eligibility checks)
 *
 * Performance optimizations:
 * - Decoded transaction args are cached to avoid repeated deserialization
 * - Single-pass processing where possible
 * - Memoized summaries computed during entry creation
 */

import { atom } from "jotai";
import { ContractCallTransaction, Transaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom, blockHeightsAtom } from "./stacks";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingTxArgs,
  isValidStackingClaimTxArgs,
  MiningTxArgs,
  MiningClaimTxArgs,
  StackingTxArgs,
  StackingClaimTxArgs,
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
// DECODED TRANSACTION CACHE
// Caches expensive deserialization results keyed by tx_id
// =============================================================================

type DecodedTxCache = Map<string, ReturnType<typeof decodeTxArgs>>;

/**
 * Get or compute decoded transaction args with caching.
 * This is critical for performance as decodeTxArgs does expensive Clarity deserialization.
 */
function getDecodedTxArgs(tx: Transaction, cache: DecodedTxCache): ReturnType<typeof decodeTxArgs> {
  const cached = cache.get(tx.tx_id);
  if (cached !== undefined) {
    return cached;
  }
  const decoded = decodeTxArgs(tx);
  cache.set(tx.tx_id, decoded);
  return decoded;
}

// =============================================================================
// HELPER: Extract city/version from contract and decoded args
// =============================================================================

/**
 * Determine city and version from contract ID and decoded transaction args.
 *
 * For legacy contracts (legacyV1, legacyV2): contract uniquely identifies the city
 * For DAO contracts (daoV1, daoV2): contract is shared, city comes from function args
 * For DAO stacking-claim (treasury) contracts: contract is city-specific
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

  // For legacy versions, contract uniquely identifies the city
  if (info.version === "legacyV1" || info.version === "legacyV2") {
    return { city: info.city, version: info.version };
  }

  // For DAO stacking-claim (treasury) contracts, the contract is city-specific
  // e.g., ccd002-treasury-mia-stacking vs ccd002-treasury-nyc-stacking
  // These contracts don't pass cityName as an argument - city is implicit
  if (info.module === "stacking-claim") {
    return { city: info.city, version: info.version };
  }

  // For shared DAO contracts (mining, stacking), use cityName from function args
  if (decoded?.cityName) {
    const cityName = decoded.cityName.toLowerCase();
    if (cityName === "mia" || cityName === "nyc") {
      return { city: cityName as CityName, version: info.version };
    }
  }

  // If no cityName in args, we can't determine the city for shared DAO contracts
  // This shouldn't happen for valid DAO transactions
  return undefined;
}

// =============================================================================
// PROCESSED TRANSACTIONS ATOM
// Single-pass processing with cached decoding for all transaction types
// =============================================================================

interface ProcessedTransactions {
  // Mining data
  miningEntries: MiningEntry[];
  claimedMiningBlocks: Map<string, string>;
  failedMiningBlocks: Map<string, string>;
  // Stacking data
  stackingEntries: StackingEntry[];
  claimedStackingCycles: Map<string, string>;
  failedStackingCycles: Map<string, string>;
}

/**
 * Pre-compute function sets once (not on every iteration)
 */
const MINING_FUNCTIONS = new Set(getAllMiningFunctions());
const MINING_CLAIM_FUNCTIONS = new Set(getAllMiningClaimFunctions());
const STACKING_FUNCTIONS = new Set(getAllStackingFunctions());
const STACKING_CLAIM_FUNCTIONS = new Set(getAllStackingClaimFunctions());

/**
 * Processes all transactions in a single pass, caching decoded args.
 * This is the foundation for all claims-related atoms.
 */
const processedTransactionsAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const currentBlock = get(blockHeightsAtom)?.stx ?? 0;

  // Cache for decoded transaction arguments
  const decodedCache: DecodedTxCache = new Map();

  // Result collections
  const result: ProcessedTransactions = {
    miningEntries: [],
    claimedMiningBlocks: new Map(),
    failedMiningBlocks: new Map(),
    stackingEntries: [],
    claimedStackingCycles: new Map(),
    failedStackingCycles: new Map(),
  };

  // Single pass through all transactions
  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    // Process mining transactions
    if (tx.tx_status === "success" && MINING_FUNCTIONS.has(functionName)) {
      const decoded = getDecodedTxArgs(tx, decodedCache);
      if (decoded && isValidMiningTxArgs(decoded)) {
        const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
        if (cityVersion) {
          const { city, version } = cityVersion;
          const numBlocks = decoded.amountsUstx.length;

          for (let i = 0; i < numBlocks; i++) {
            const block = tx.block_height + i;
            result.miningEntries.push({
              txId: tx.tx_id,
              block,
              city,
              version,
              contractId,
              functionName,
              amountUstx: decoded.amountsUstx[i],
              status: isMiningClaimEligible(block, currentBlock) ? "unverified" : "pending",
            });
          }
        }
      }
    }

    // Process mining claim transactions
    if (MINING_CLAIM_FUNCTIONS.has(functionName)) {
      const decoded = getDecodedTxArgs(tx, decodedCache);
      if (decoded && isValidMiningClaimTxArgs(decoded)) {
        const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
        if (cityVersion) {
          const block = Number(decoded.minerBlockHeight);
          const key = `${cityVersion.city}-${cityVersion.version}-${block}`;

          if (tx.tx_status === "success") {
            result.claimedMiningBlocks.set(key, tx.tx_id);
          } else if (tx.tx_status === "abort_by_response") {
            result.failedMiningBlocks.set(key, tx.tx_id);
          }
        }
      }
    }

    // Process stacking transactions
    if (tx.tx_status === "success" && STACKING_FUNCTIONS.has(functionName)) {
      const decoded = getDecodedTxArgs(tx, decodedCache);
      if (decoded && isValidStackingTxArgs(decoded)) {
        const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
        if (cityVersion) {
          const { city, version } = cityVersion;
          const lockPeriod = Number(decoded.lockPeriod);
          const amountTokens = decoded.amountToken;
          const startCycle = getBlockCycle(city, version, tx.block_height);
          const { endCycle } = CITY_CONFIG[city][version].stacking;

          for (let i = 0; i < lockPeriod; i++) {
            const cycle = startCycle + i;
            if (endCycle !== undefined && cycle > endCycle) continue;

            result.stackingEntries.push({
              txId: tx.tx_id,
              cycle,
              city,
              version,
              contractId,
              functionName,
              amountTokens,
              status: isStackingClaimEligible(city, version, cycle, currentBlock)
                ? "unverified"
                : "locked",
            });
          }
        }
      }
    }

    // Process stacking claim transactions
    if (STACKING_CLAIM_FUNCTIONS.has(functionName)) {
      const decoded = getDecodedTxArgs(tx, decodedCache);
      if (decoded && isValidStackingClaimTxArgs(decoded)) {
        const cityVersion = getCityVersionFromContractAndArgs(contractId, decoded);
        if (cityVersion) {
          const cycle = Number(decoded.rewardCycle);
          const key = `${cityVersion.city}-${cityVersion.version}-${cycle}`;

          if (tx.tx_status === "success") {
            result.claimedStackingCycles.set(key, tx.tx_id);
          } else if (tx.tx_status === "abort_by_response") {
            result.failedStackingCycles.set(key, tx.tx_id);
          }
        }
      }
    }
  }

  return result;
});

// =============================================================================
// MINING ENTRIES ATOM
// Tracks all blocks user has mined across all cities/versions
// =============================================================================

export const miningEntriesAtom = atom((get) => {
  const processed = get(processedTransactionsAtom);
  const { miningEntries, claimedMiningBlocks, failedMiningBlocks } = processed;

  // Update entries with claim status
  return miningEntries.map((entry) => {
    const key = `${entry.city}-${entry.version}-${entry.block}`;
    const claimTxId = claimedMiningBlocks.get(key);
    const failedTxId = failedMiningBlocks.get(key);

    if (claimTxId) {
      return { ...entry, status: "claimed" as MiningStatus, claimTxId };
    } else if (failedTxId) {
      return { ...entry, status: "not-won" as MiningStatus, claimTxId: failedTxId };
    }
    return entry;
  });
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
  const processed = get(processedTransactionsAtom);
  const { stackingEntries, claimedStackingCycles, failedStackingCycles } = processed;

  // Update entries with claim status
  return stackingEntries.map((entry) => {
    const key = `${entry.city}-${entry.version}-${entry.cycle}`;
    const claimTxId = claimedStackingCycles.get(key);
    const failedTxId = failedStackingCycles.get(key);

    if (claimTxId) {
      return { ...entry, status: "claimed" as StackingStatus, claimTxId };
    } else if (failedTxId) {
      return { ...entry, status: "unavailable" as StackingStatus, claimTxId: failedTxId };
    }
    return entry;
  });
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
// Optimized to compute summaries in a single pass
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

const emptySummary = (): CitySummary => ({
  miningTotal: 0,
  miningClaimed: 0,
  miningClaimable: 0,
  miningPending: 0,
  miningUnverified: 0,
  miningNotWon: 0,
  miningError: 0,
  stackingTotal: 0,
  stackingClaimed: 0,
  stackingClaimable: 0,
  stackingLocked: 0,
  stackingUnverified: 0,
  stackingNoReward: 0,
  stackingUnavailable: 0,
});

/**
 * Optimized summary computation - single pass through entries
 */
export const claimsSummaryAtom = atom<ClaimsSummary>((get) => {
  const miningEntries = get(verifiedMiningEntriesAtom);
  const stackingEntries = get(verifiedStackingEntriesAtom);

  const result: ClaimsSummary = {
    mia: emptySummary(),
    nyc: emptySummary(),
  };

  // Single pass through mining entries
  for (const entry of miningEntries) {
    const summary = result[entry.city];
    summary.miningTotal++;
    switch (entry.status) {
      case "claimed": summary.miningClaimed++; break;
      case "claimable": summary.miningClaimable++; break;
      case "pending": summary.miningPending++; break;
      case "unverified": summary.miningUnverified++; break;
      case "not-won": summary.miningNotWon++; break;
      case "error": summary.miningError++; break;
    }
  }

  // Single pass through stacking entries
  for (const entry of stackingEntries) {
    const summary = result[entry.city];
    summary.stackingTotal++;
    switch (entry.status) {
      case "claimed": summary.stackingClaimed++; break;
      case "claimable": summary.stackingClaimable++; break;
      case "locked": summary.stackingLocked++; break;
      case "unverified": summary.stackingUnverified++; break;
      case "no-reward": summary.stackingNoReward++; break;
      case "unavailable": summary.stackingUnavailable++; break;
    }
  }

  return result;
});
