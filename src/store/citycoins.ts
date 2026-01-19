/**
 * CityCoins Transaction Type Atoms
 *
 * Provides derived atoms for filtering transactions by type.
 * Uses single-pass processing for better performance.
 */

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom } from "./stacks";
import { atom } from "jotai";
import { CONTRACTS, CoinType, ContractConfig, VOTING_CONTRACTS } from "../config/city-config";

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

type ContractFunctionMap = {
  [contract: string]: string | string[];
};

// =============================================================================
// PRE-COMPUTED CONTRACT MAPS (computed once at module load)
// =============================================================================

function getContractFunctionMap(type: keyof ContractConfig['functions'], coin?: CoinType): ContractFunctionMap {
  const map: ContractFunctionMap = {};

  const addToMap = (contract: string, functions: string | string[]) => {
    map[contract] = functions;
  };

  Object.entries(CONTRACTS).forEach(([key, config]) => {
    if (!coin || key === coin) {
      const funcs = config.functions[type];
      addToMap(config.v1.core, funcs);
      addToMap(config.v2.core, funcs);
      if (type === 'mining' && config.miningV2) {
        addToMap(config.miningV2, funcs);
      }
      if (type === 'stacking' && config.stackingV2) {
        addToMap(config.stackingV2, funcs);
      }
      if (type === 'transfer') {
        addToMap(config.v1.token, funcs);
        addToMap(config.v2.token, funcs);
      }
    }
  });

  return map;
}

// Pre-compute contract maps once at module load (not on every iteration)
const MINING_CONTRACT_MAP = getContractFunctionMap('mining');
const MINING_CLAIMS_CONTRACT_MAP = getContractFunctionMap('miningClaims');
const STACKING_CONTRACT_MAP = getContractFunctionMap('stacking');
const STACKING_CLAIMS_CONTRACT_MAP = getContractFunctionMap('stackingClaims');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function checkContract(
  contractName: string,
  contractCallsMap: ContractFunctionMap
) {
  return contractCallsMap.hasOwnProperty(contractName);
}

function checkFunctionName(
  contractId: string,
  functionName: string,
  transactionCalls: ContractFunctionMap
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
    if (checkContract(contractId, MINING_CONTRACT_MAP) &&
        checkFunctionName(contractId, functionName, MINING_CONTRACT_MAP)) {
      result.mining.push(tx);
    } else if (checkContract(contractId, MINING_CLAIMS_CONTRACT_MAP) &&
        checkFunctionName(contractId, functionName, MINING_CLAIMS_CONTRACT_MAP)) {
      result.miningClaims.push(tx);
    } else if (checkContract(contractId, STACKING_CONTRACT_MAP) &&
        checkFunctionName(contractId, functionName, STACKING_CONTRACT_MAP)) {
      result.stacking.push(tx);
    } else if (checkContract(contractId, STACKING_CLAIMS_CONTRACT_MAP) &&
        checkFunctionName(contractId, functionName, STACKING_CLAIMS_CONTRACT_MAP)) {
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
