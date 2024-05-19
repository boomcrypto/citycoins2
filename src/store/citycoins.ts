// DERIVED ATOMS FOR TRANSACTIONS

import {
  ContractCallTransaction,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { hexToCV, cvToJSON, cvToValue } from "@stacks/transactions";
import { transactionsAtom } from "./stacks";
import { atom } from "jotai";

// helpers for selecting specific transaction types

export type CityNames = "mia" | "nyc";

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

function getTransactionsPerCity(
  city: CityNames,
  transactions: ContractCallTransaction[]
) {
  console.log("getting txs per city", city, transactions.length);
  const transactionsPerCity: ContractCallTransaction[] = [];
  // check for legacy calls
  transactions.forEach((tx) => {
    console.log("evaluating a tx for city", tx.contract_call.contract_id);
    // match legacy calls to core contracts
    if (tx.contract_call.contract_id.includes(city)) {
      console.log("legacy call to core contract", city);
      transactionsPerCity.push(tx);
    }
    // handle ccd006 calls
    if (
      tx.contract_call.function_name === "mine" &&
      tx.contract_call.function_args
    ) {
      console.log("ccd006 mining call", tx.contract_call.function_args[0].repr);
      const cityName = cvToValue(
        hexToCV(tx.contract_call.function_args[0].hex)
      );
      if (cityName === city) {
        transactionsPerCity.push(tx);
      }
    }
  });
  return transactionsPerCity;
}

function getBlockHeightsFromTransactions(
  transactions: ContractCallTransaction[]
): number[] {
  const blockHeights: number[] = [];
  transactions.forEach((tx) => {
    console.log("evaluating a tx for block heights");
    // handle single mining call
    if (
      tx.contract_call.function_name === "mine-tokens" &&
      tx.contract_call.function_args
    ) {
      console.log("single mining call", tx.contract_call.function_args[0].repr);
      const blockHeight = cvToValue(
        hexToCV(tx.contract_call.function_args[0].hex)
      );
      blockHeight && blockHeights.push(Number(blockHeight));
    }
    // handle legacy mine-many calls
    if (
      tx.contract_call.function_name === "mine-many" &&
      tx.contract_call.function_args
    ) {
      console.log(
        "legacy mine-many call",
        tx.contract_call.function_args[0].repr
      );
      const blockHeightsJson = cvToJSON(
        hexToCV(tx.contract_call.function_args[0].hex)
      );
      blockHeightsJson.value.forEach((blockHeight: number) => {
        blockHeights.push(blockHeight);
      });
    }
    // handle ccd006 mining calls
    if (
      tx.contract_call.function_name === "mine" &&
      tx.contract_call.function_args
    ) {
      console.log("ccd006 mining call", tx.contract_call.function_args[1].repr);
      const blockHeightsJson = cvToJSON(
        hexToCV(tx.contract_call.function_args[1].hex)
      );
      blockHeightsJson.value.forEach((blockHeight: number) => {
        blockHeights.push(blockHeight);
      });
    }
    console.log(
      "unhandled mining tx",
      tx.contract_call.function_name,
      tx.contract_call.function_args
    );
  });
  return blockHeights;
}

// MINING TRANSACTIONS

const miningTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1": [
    "mine-tokens",
    "mine-many",
  ],
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2": [
    "mine-tokens",
    "mine-many",
  ],
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1": [
    "mine-tokens",
    "mine-many",
  ],
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2": [
    "mine-tokens",
    "mine-many",
  ],
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
    ) as ContractCallTransaction[];
  }
);

export const miningTransactionsPerCityAtom = atom((get) => {
  const miningTransactions = get(miningTransactionsAtom);
  console.log("mining transactions", miningTransactions.length);
  const miaMiningTransactions = getTransactionsPerCity(
    "mia",
    miningTransactions
  );
  const nycMiningTransactions = getTransactionsPerCity(
    "nyc",
    miningTransactions
  );
  console.log(
    "mining txs per city",
    miaMiningTransactions.length,
    nycMiningTransactions.length
  );
  return { miaMiningTransactions, nycMiningTransactions };
});

export const miningBlocksToClaimPerCityAtom = atom((get) => {
  const { miaMiningTransactions, nycMiningTransactions } = get(
    miningTransactionsPerCityAtom
  );
  const miaBlockHeights = getBlockHeightsFromTransactions(
    miaMiningTransactions
  );
  const nycBlockHeights = getBlockHeightsFromTransactions(
    nycMiningTransactions
  );
  return { miaBlockHeights, nycBlockHeights };
});

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

// VOTING TRANSACTIONS

const votingTransactionCalls: ContractFunctionMap = {
  "SP34FHX44NK9KZ8KJC08WR2NHP8NEGFTTT7MTH7XD.citycoins-vote-v1":
    "vote-on-proposal",
  "SP119FQPVQ39AKVMC0CN3Q1ZN3ZMCGMBR52ZS5K6E.citycoins-vote-v2":
    "vote-on-proposal",
  "SP5X6BFPYXTZ8C63EYYPA02X2VQTG4V43XNPGAPF.citycoins-vote-v3":
    "vote-on-proposal",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3": "vote-on-proposal",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period":
    "vote-on-proposal",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2":
    "vote-on-proposal",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown":
    "vote-on-proposal",
};

export const votingTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(tx.contract_call.contract_id, votingTransactionCalls) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          votingTransactionCalls
        )
    );
  }
);
