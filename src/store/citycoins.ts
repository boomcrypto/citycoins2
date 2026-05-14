/**
 * CityCoins Transaction Type Atoms
 *
 * Provides derived atoms for filtering transactions by type.
 * Uses single-pass processing for better performance.
 */

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom } from "./stacks";
import { atom } from "jotai";
import {
  CITY_CONFIG,
  CityName,
  VERSIONS,
  VOTING_CONTRACTS,
} from "../config/city-config";

// =============================================================================
// TYPES
// =============================================================================

export type TransactionTypes =
  | "all"
  | "mining"
  | "mining-claims"
  | "stacking"
  | "stacking-claims"
  | "voting";

type ContractFunctionSetMap = Record<string, Set<string>>;

function addFunctions(
  map: ContractFunctionSetMap,
  contractId: string,
  functions: string[]
) {
  const existing = map[contractId] ?? new Set<string>();
  for (const functionName of functions) {
    existing.add(functionName);
  }
  map[contractId] = existing;
}

function buildContractFunctionMaps() {
  const mining: ContractFunctionSetMap = {};
  const miningClaims: ContractFunctionSetMap = {};
  const stacking: ContractFunctionSetMap = {};
  const stackingClaims: ContractFunctionSetMap = {};

  for (const city of ["mia", "nyc"] as CityName[]) {
    for (const version of VERSIONS) {
      const config = CITY_CONFIG[city][version];

      addFunctions(mining, config.mining.contractId, config.mining.functions.mine);
      addFunctions(miningClaims, config.mining.contractId, config.mining.functions.claim);
      addFunctions(stacking, config.stacking.contractId, config.stacking.functions.stack);
      addFunctions(
        stackingClaims,
        config.stacking.claimContractId,
        config.stacking.functions.claim
      );
    }
  }

  return { mining, miningClaims, stacking, stackingClaims };
}

const CONTRACT_FUNCTION_MAPS = buildContractFunctionMaps();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function checkContract(
  contractName: string,
  contractCallsMap: Record<string, string | string[]>
) {
  return contractCallsMap.hasOwnProperty(contractName);
}

function checkFunctionSet(
  contractId: string,
  functionName: string,
  transactionCalls: ContractFunctionSetMap
): boolean {
  return transactionCalls[contractId]?.has(functionName) ?? false;
}

function checkFunctionName(
  contractId: string,
  functionName: string,
  transactionCalls: Record<string, string | string[]>
): boolean {
  const expectedFunctionName = transactionCalls[contractId];
  if (Array.isArray(expectedFunctionName)) {
    return expectedFunctionName.includes(functionName);
  } else {
    return functionName === expectedFunctionName;
  }
}

// =============================================================================
// CATEGORIZED TRANSACTIONS ATOM (Single-pass processing)
// =============================================================================

interface CategorizedTransactions {
  mining: Transaction[];
  miningClaims: Transaction[];
  stacking: Transaction[];
  stackingClaims: Transaction[];
  voting: Transaction[];
}

/**
 * Single-pass categorization of all transactions.
 * This is more efficient than having each atom filter the full list separately.
 */
const categorizedTransactionsAtom = atom<CategorizedTransactions>((get) => {
  const transactions = get(transactionsAtom);

  const result: CategorizedTransactions = {
    mining: [],
    miningClaims: [],
    stacking: [],
    stackingClaims: [],
    voting: [],
  };

  // Single pass through all transactions
  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;

    const contractId = tx.contract_call.contract_id;
    const functionName = tx.contract_call.function_name;

    // Check each category (a transaction can match multiple categories if needed)
    if (checkFunctionSet(contractId, functionName, CONTRACT_FUNCTION_MAPS.mining)) {
      result.mining.push(tx);
    } else if (checkFunctionSet(contractId, functionName, CONTRACT_FUNCTION_MAPS.miningClaims)) {
      result.miningClaims.push(tx);
    } else if (checkFunctionSet(contractId, functionName, CONTRACT_FUNCTION_MAPS.stacking)) {
      result.stacking.push(tx);
    } else if (checkFunctionSet(contractId, functionName, CONTRACT_FUNCTION_MAPS.stackingClaims)) {
      result.stackingClaims.push(tx);
    } else if (checkContract(contractId, VOTING_CONTRACTS) &&
        checkFunctionName(contractId, functionName, VOTING_CONTRACTS)) {
      result.voting.push(tx);
    }
  }

  return result;
});

// =============================================================================
// INDIVIDUAL TRANSACTION TYPE ATOMS
// =============================================================================

export const miningTransactionsAtom = atom((get) => {
  return get(categorizedTransactionsAtom).mining;
});

export const miningClaimTransactionsAtom = atom((get) => {
  return get(categorizedTransactionsAtom).miningClaims;
});

export const stackingTransactionsAtom = atom((get) => {
  return get(categorizedTransactionsAtom).stacking;
});

export const stackingClaimTransactionsAtom = atom((get) => {
  return get(categorizedTransactionsAtom).stackingClaims;
});

export const votingTransactionsAtom = atom((get) => {
  return get(categorizedTransactionsAtom).voting;
});

// =============================================================================
// SELECTED TRANSACTION TYPE ATOMS
// =============================================================================

export const selectedTransactionTypeAtom = atom<TransactionTypes>("all");

export const selectedTransactionsAtom = atom<Transaction[]>((get) => {
  const selectedTransactionType = get(selectedTransactionTypeAtom);

  switch (selectedTransactionType) {
    case "mining":
      return get(miningTransactionsAtom);
    case "mining-claims":
      return get(miningClaimTransactionsAtom);
    case "stacking":
      return get(stackingTransactionsAtom);
    case "stacking-claims":
      return get(stackingClaimTransactionsAtom);
    case "voting":
      return get(votingTransactionsAtom);
    case "all":
    default:
      return get(transactionsAtom);
  }
});
