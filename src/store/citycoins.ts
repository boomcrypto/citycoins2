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

function checkTransactionForCity(
  city: CityNames,
  transaction: ContractCallTransaction
) {
  // handle legacy calls
  if (transaction.contract_call.contract_id.includes(city)) {
    return true;
  }
  // handle ccd006 calls
  if (
    transaction.contract_call.function_name === "mine" &&
    transaction.contract_call.function_args
  ) {
    const cityName = cvToValue(
      hexToCV(transaction.contract_call.function_args[0].hex)
    );
    return cityName === city;
  }
}

function getBlockHeightsFromMiningTransactions(
  transactions: ContractCallTransaction[]
): number[] {
  const blockHeights: number[] = [];
  transactions.forEach((tx) => {
    if (tx.contract_call.function_args) {
      switch (tx.contract_call.function_name) {
        case "mine-tokens":
          // block height to claim is the block height of the tx
          blockHeights.push(Number(tx.block_height));
          break;
        case "mine-many":
          // block height to claim is the block height of the tx
          // plus the number of blocks mined (length of args list)
          const blockHeightsJson = cvToJSON(
            hexToCV(tx.contract_call.function_args[0].hex)
          );
          for (let i = 0; i < blockHeightsJson.value.length; i++) {
            blockHeights.push(Number(tx.block_height) + i);
          }
          break;
        case "mine":
          // block height to claim is the block height of the tx
          // plus the number of blocks mined (length of args list)
          const blockHeightsJson2 = cvToJSON(
            hexToCV(tx.contract_call.function_args[1].hex)
          );
          for (let i = 0; i < blockHeightsJson2.value.length; i++) {
            blockHeights.push(Number(tx.block_height) + i);
          }
          break;
        default:
          console.log(
            "unhandled mining tx",
            tx.contract_call.contract_id,
            tx.contract_call.function_name,
            tx.contract_call.function_args
          );
      }
    }
  });
  return blockHeights;
}

function getBlockHeightsFromMiningClaimTransactions(
  transactions: ContractCallTransaction[]
): number[] {
  const blockHeights: number[] = [];
  transactions.forEach((tx) => {
    if (
      tx.contract_call.function_name === "claim-mining-reward" &&
      tx.contract_call.function_args
    ) {
      console.log(tx.contract_call.function_args);
      const blockHeight = cvToValue(
        hexToCV(tx.contract_call.function_args[0].hex)
      );
      blockHeight && blockHeights.push(Number(blockHeight));
    }
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
  const miaMiningTransactions = miningTransactions.filter((tx) =>
    checkTransactionForCity("mia", tx)
  );
  const nycMiningTransactions = miningTransactions.filter((tx) =>
    checkTransactionForCity("nyc", tx)
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
  const { miaMiningClaimTransactions, nycMiningClaimTransactions } = get(
    miningClaimTransactionsPerCityAtom
  );
  const miaBlockHeightsFromMining = getBlockHeightsFromMiningTransactions(
    miaMiningTransactions
  );
  const nycBlockHeightsFromMining = getBlockHeightsFromMiningTransactions(
    nycMiningTransactions
  );
  const miaBlockHeightsFromMiningClaims =
    getBlockHeightsFromMiningClaimTransactions(miaMiningClaimTransactions);
  const nycBlockHeightsFromMiningClaims =
    getBlockHeightsFromMiningClaimTransactions(nycMiningClaimTransactions);
  console.log(
    "MIA block heights: ",
    miaBlockHeightsFromMining.length,
    miaBlockHeightsFromMiningClaims.length
  );
  console.log(
    "NYC block heights: ",
    nycBlockHeightsFromMining.length,
    nycBlockHeightsFromMiningClaims.length
  );
  // create an object with any block heights in mining that are not in mining claims
  const miaBlockHeights = miaBlockHeightsFromMining.filter(
    (height) => !miaBlockHeightsFromMiningClaims.includes(height)
  );
  const nycBlockHeights = nycBlockHeightsFromMining.filter(
    (height) => !nycBlockHeightsFromMiningClaims.includes(height)
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
    ) as ContractCallTransaction[];
  }
);

export const miningClaimTransactionsPerCityAtom = atom((get) => {
  const miningClaimTransactions = get(miningClaimTransactionsAtom);
  console.log("mining claim transactions", miningClaimTransactions.length);
  const miaMiningClaimTransactions = miningClaimTransactions.filter((tx) =>
    checkTransactionForCity("mia", tx)
  );
  const nycMiningClaimTransactions = miningClaimTransactions.filter((tx) =>
    checkTransactionForCity("nyc", tx)
  );
  console.log(
    "mining claim txs per city",
    miaMiningClaimTransactions.length,
    nycMiningClaimTransactions.length
  );
  return { miaMiningClaimTransactions, nycMiningClaimTransactions };
});

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
    ) as ContractCallTransaction[];
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
    ) as ContractCallTransaction[];
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
    ) as ContractCallTransaction[];
  }
);
