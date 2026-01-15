/**
 * Claims Tracking Atoms
 *
 * These atoms compute mining and stacking claim eligibility by:
 * 1. Tracking what was mined/stacked (from user transactions)
 * 2. Tracking what was already claimed (from claim transactions)
 * 3. Computing what's still claimable (difference + eligibility checks)
 */

import { atom } from "jotai";
import { Transaction, ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";
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
  getVersionByBlock,
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

export interface MiningEntry {
  txId: string;
  block: number;
  city: CityName;
  version: Version;
  contractId: string;
  functionName: string;
  amountUstx: bigint;
  status: "pending" | "claimable" | "claimed" | "unknown";
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
  status: "locked" | "claimable" | "claimed" | "unknown";
  claimTxId?: string;
}

// =============================================================================
// HELPER: Extract city/version from contract
// =============================================================================

function getCityVersionFromContract(
  contractId: string,
  functionName: string
): { city: CityName; version: Version } | undefined {
  const info = findContractInfo(contractId);
  if (info && (info.module === "mining" || info.module === "stacking")) {
    return { city: info.city, version: info.version };
  }
  return undefined;
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

    const cityVersion = getCityVersionFromContract(contractId, functionName);
    if (!cityVersion) continue;

    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidMiningTxArgs(decoded)) continue;

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
        status: isMiningClaimEligible(block, currentBlock) ? "claimable" : "pending",
      });
    }
  }

  // Second pass: mark claimed blocks
  const claimedBlocks = new Map<string, string>(); // "city-block" -> claimTxId

  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;
    if (tx.tx_status !== "success") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!claimFunctions.includes(functionName)) continue;

    const cityVersion = getCityVersionFromContract(contractId, functionName);
    if (!cityVersion) continue;

    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidMiningClaimTxArgs(decoded)) continue;

    const block = Number(decoded.minerBlockHeight);
    const key = `${cityVersion.city}-${block}`;
    claimedBlocks.set(key, tx.tx_id);
  }

  // Update entries with claim status
  for (const entry of entries) {
    const key = `${entry.city}-${entry.block}`;
    const claimTxId = claimedBlocks.get(key);
    if (claimTxId) {
      entry.status = "claimed";
      entry.claimTxId = claimTxId;
    }
  }

  return entries;
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

    const cityVersion = getCityVersionFromContract(contractId, functionName);
    if (!cityVersion) continue;

    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidStackingTxArgs(decoded)) continue;

    const { city, version } = cityVersion;
    const lockPeriod = Number(decoded.lockPeriod);
    const amountTokens = decoded.amountToken;

    // Calculate start cycle based on block height and version's genesis
    const startCycle = getBlockCycle(city, version, tx.block_height);

    for (let i = 0; i < lockPeriod; i++) {
      const cycle = startCycle + i;

      entries.push({
        txId: tx.tx_id,
        cycle,
        city,
        version,
        contractId,
        functionName,
        amountTokens,
        status: isStackingClaimEligible(city, version, cycle, currentBlock)
          ? "claimable"
          : "locked",
      });
    }
  }

  // Second pass: mark claimed cycles
  const claimedCycles = new Map<string, string>(); // "city-cycle" -> claimTxId

  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;
    if (tx.tx_status !== "success") continue;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    if (!claimFunctions.includes(functionName)) continue;

    const cityVersion = getCityVersionFromContract(contractId, functionName);
    if (!cityVersion) continue;

    const decoded = decodeTxArgs(tx);
    if (!decoded || !isValidStackingClaimTxArgs(decoded)) continue;

    const cycle = Number(decoded.rewardCycle);
    const key = `${cityVersion.city}-${cycle}`;
    claimedCycles.set(key, tx.tx_id);
  }

  // Update entries with claim status
  for (const entry of entries) {
    const key = `${entry.city}-${entry.cycle}`;
    const claimTxId = claimedCycles.get(key);
    if (claimTxId) {
      entry.status = "claimed";
      entry.claimTxId = claimTxId;
    }
  }

  return entries;
});

// =============================================================================
// CITY-FILTERED ATOMS
// =============================================================================

export const miaMiningEntriesAtom = atom((get) => {
  const entries = get(miningEntriesAtom);
  return entries.filter((e) => e.city === "mia");
});

export const nycMiningEntriesAtom = atom((get) => {
  const entries = get(miningEntriesAtom);
  return entries.filter((e) => e.city === "nyc");
});

export const miaStackingEntriesAtom = atom((get) => {
  const entries = get(stackingEntriesAtom);
  return entries.filter((e) => e.city === "mia");
});

export const nycStackingEntriesAtom = atom((get) => {
  const entries = get(stackingEntriesAtom);
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

export interface ClaimsSummary {
  mia: {
    miningTotal: number;
    miningClaimed: number;
    miningClaimable: number;
    miningPending: number;
    stackingTotal: number;
    stackingClaimed: number;
    stackingClaimable: number;
    stackingLocked: number;
  };
  nyc: {
    miningTotal: number;
    miningClaimed: number;
    miningClaimable: number;
    miningPending: number;
    stackingTotal: number;
    stackingClaimed: number;
    stackingClaimable: number;
    stackingLocked: number;
  };
}

export const claimsSummaryAtom = atom<ClaimsSummary>((get) => {
  const miningEntries = get(miningEntriesAtom);
  const stackingEntries = get(stackingEntriesAtom);

  const summarize = (city: CityName) => {
    const mining = miningEntries.filter((e) => e.city === city);
    const stacking = stackingEntries.filter((e) => e.city === city);

    return {
      miningTotal: mining.length,
      miningClaimed: mining.filter((e) => e.status === "claimed").length,
      miningClaimable: mining.filter((e) => e.status === "claimable").length,
      miningPending: mining.filter((e) => e.status === "pending").length,
      stackingTotal: stacking.length,
      stackingClaimed: stacking.filter((e) => e.status === "claimed").length,
      stackingClaimable: stacking.filter((e) => e.status === "claimable").length,
      stackingLocked: stacking.filter((e) => e.status === "locked").length,
    };
  };

  return {
    mia: summarize("mia"),
    nyc: summarize("nyc"),
  };
});
