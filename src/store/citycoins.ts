// DERIVED ATOMS FOR TRANSACTIONS

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom } from "./stacks";
import { atom } from "jotai";
import { CONTRACTS, CoinType, VOTING_CONTRACTS } from "../utilities/contracts";

// helpers for selecting specific transaction types

export type TransactionTypes =
  | "all"
  | "mining"
  | "mining-claims"
  | "stacking"
  | "stacking-claims"
  | "voting";

export const selectedTransactionTypeAtom = atom<TransactionTypes>("all");
export const selectedTransactionsAtom = atom<Transaction[]>((get) => {
  const selectedTransactionType = get(selectedTransactionTypeAtom);

  switch (selectedTransactionType) {
    case "mining":
      const miningTransactions = get(miningTransactionsAtom);
      return miningTransactions;
    case "mining-claims":
      const miningClaimTransactions = get(miningClaimTransactionsAtom);
      return miningClaimTransactions;
    case "stacking":
      const stackingTransactions = get(stackingTransactionsAtom);
      return stackingTransactions;
    case "stacking-claims":
      const stackingClaimTransactions = get(stackingClaimTransactionsAtom);
      return stackingClaimTransactions;
    case "voting":
      const votingTransactions = get(votingTransactionsAtom);
      return votingTransactions;
    case "all":
    default:
      const existingTransactions = get(transactionsAtom);
      return existingTransactions;
  }
});

// helpers for identifying specific contract calls

type ContractFunctionMap = {
  [contract: string]: string | string[];
};

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

// MINING TRANSACTIONS

export const miningTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    const miningTransactionCalls = getContractFunctionMap('mining');
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(tx.contract_call.contract_id, miningTransactionCalls) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          miningTransactionCalls
        )
    );
  }
);

export const miningClaimTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    const miningClaimTransactionCalls = getContractFunctionMap('miningClaims');
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(
          tx.contract_call.contract_id,
          miningClaimTransactionCalls
        ) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          miningClaimTransactionCalls
        )
    );
  }
);

export const stackingTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    const stackingTransactionCalls = getContractFunctionMap('stacking');
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(tx.contract_call.contract_id, stackingTransactionCalls) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          stackingTransactionCalls
        )
    );
  }
);

export const stackingClaimTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    const stackingClaimTransactionCalls = getContractFunctionMap('stackingClaims');
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(
          tx.contract_call.contract_id,
          stackingClaimTransactionCalls
        ) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          stackingClaimTransactionCalls
        )
    );
  }
);

export const votingTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(tx.contract_call.contract_id, VOTING_CONTRACTS) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          VOTING_CONTRACTS
        )
    );
  }
);
