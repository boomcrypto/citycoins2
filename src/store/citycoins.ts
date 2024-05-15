// DERIVED ATOMS FOR TRANSACTIONS

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { transactionsAtom } from "./stacks";
import { atom } from "jotai";

// helpers for selecting specific transaction types

type TransactionTypes =
  | "all"
  | "mining"
  | "mining-claims"
  | "stacking"
  | "stacking-claims";

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
    case "all":
    default:
      const existingTransactions = get(transactionsAtom);
      return existingTransactions;
  }
});

// helpers for identifying specific contract calls

type ContractFunctionMap = {
  [contract: string]: string;
};

function checkContract(
  contractName: string,
  contractCallsMap: ContractFunctionMap
) {
  return contractCallsMap.hasOwnProperty(contractName);
}

function checkFunctionName(
  contractName: string,
  functionName: string,
  contractCallsMap: ContractFunctionMap
) {
  return contractCallsMap[contractName] === functionName;
}

// MINING TRANSACTIONS

const miningTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1": "mine-tokens",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2": "mine-tokens",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "mine-tokens",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "mine-tokens",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining": "mine",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2": "mine",
};

export const miningTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
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

// MINING CLAIM TRANSACTIONS

const miningClaimTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1":
    "claim-mining-reward",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2":
    "claim-mining-reward",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "claim-mining-reward",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "claim-mining-reward",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining":
    "claim-mining-reward",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2":
    "claim-mining-reward",
};

export const miningClaimTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
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

// STACKING TRANSACTIONS

const stackingTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1": "stack-tokens",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2": "stack-tokens",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "stack-tokens",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "stack-tokens",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking": "stack",
};

export const stackingTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
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

// STACKING CLAIM TRANSACTIONS

const stackingClaimTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1":
    "claim-stacking-reward",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2":
    "claim-stacking-reward",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "claim-stacking-reward",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "claim-stacking-reward",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking":
    "claim-stacking-reward",
};

export const stackingClaimTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
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
