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

// legacy contracts

const miaCoreV1 = "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1";
const miaCoreV2 = "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2";
const nycCoreV1 =
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1";
const nycCoreV2 =
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2";

const legacyContracts = [miaCoreV1, miaCoreV2, nycCoreV1, nycCoreV2];

// protocol contracts

const ccd006Mining =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining";
const ccd006MiningV2 =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2";
const ccd007Stacking =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking";

const protocolContracts = [ccd006Mining, ccd006MiningV2, ccd007Stacking];

// voting contracts

const ccip008 = "SP34FHX44NK9KZ8KJC08WR2NHP8NEGFTTT7MTH7XD.citycoins-vote-v1";
const ccip012 = "SP119FQPVQ39AKVMC0CN3Q1ZN3ZMCGMBR52ZS5K6E.citycoins-vote-v2";
const ccip013 = "SP5X6BFPYXTZ8C63EYYPA02X2VQTG4V43XNPGAPF.citycoins-vote-v3";
const ccip014 = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3";
const ccip014V2 = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd014-pox-3-v2";
const ccip017 =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period";
const ccip021 =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2";
const ccip020 =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown";

const votingContracts = [
  ccip008,
  ccip012,
  ccip013,
  ccip014,
  ccip014V2,
  ccip017,
  ccip021,
  ccip020,
];

// type used to define function calls for specific contracts
type ContractFunctionMap = {
  [contract: string]: string | string[];
};

// filters for specific contract calls

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
  if (legacyContracts.includes(transaction.contract_call.contract_id)) {
    // city name is in the contract name
    if (transaction.contract_call.contract_id.includes(city)) {
      return true;
    }
  }
  // handle protocol calls
  if (protocolContracts.includes(transaction.contract_call.contract_id)) {
    // city name is in the function arguments
    if (transaction.contract_call.function_args) {
      const cityName = cvToValue(
        hexToCV(transaction.contract_call.function_args[0].hex)
      );
      return cityName === city;
    }
  }
  return false;
}

// MINING TRANSACTIONS

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

const miningTransactionCalls: ContractFunctionMap = {
  [miaCoreV1]: ["mine-tokens", "mine-many"],
  [miaCoreV2]: ["mine-tokens", "mine-many"],
  [nycCoreV1]: ["mine-tokens", "mine-many"],
  [nycCoreV2]: ["mine-tokens", "mine-many"],
  [ccd006Mining]: "mine",
  [ccd006MiningV2]: "mine",
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
  const miaMiningTransactions = miningTransactions.filter((tx) =>
    checkTransactionForCity("mia", tx)
  );
  const nycMiningTransactions = miningTransactions.filter((tx) =>
    checkTransactionForCity("nyc", tx)
  );
  return { miaMiningTransactions, nycMiningTransactions };
});

// MINING CLAIM TRANSACTIONS

function getBlockHeightsFromMiningClaimTransactions(
  transactions: ContractCallTransaction[]
): number[] {
  const blockHeights: number[] = [];
  transactions.forEach((tx) => {
    if (tx.contract_call.function_args) {
      switch (tx.contract_call.contract_id) {
        case miaCoreV1:
        case nycCoreV1:
        case miaCoreV2:
        case nycCoreV2:
          // claimed block height is first parameter
          const blockHeightLegacy = cvToValue(
            hexToCV(tx.contract_call.function_args[0].hex)
          );
          blockHeightLegacy && blockHeights.push(Number(blockHeightLegacy));
          break;
        case ccd006Mining:
        case ccd006MiningV2:
          // claimed block height is second parameter
          const blockHeight = cvToValue(
            hexToCV(tx.contract_call.function_args[1].hex)
          );
          blockHeight && blockHeights.push(Number(blockHeight));
          break;
      }
    }
  });
  return blockHeights;
}

const miningClaimTransactionCalls: ContractFunctionMap = {
  [miaCoreV1]: "claim-mining-reward",
  [miaCoreV2]: "claim-mining-reward",
  [nycCoreV1]: "claim-mining-reward",
  [nycCoreV2]: "claim-mining-reward",
  [ccd006Mining]: "claim-mining-reward",
  [ccd006MiningV2]: "claim-mining-reward",
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
  const miaMiningClaimTransactions = miningClaimTransactions.filter((tx) =>
    checkTransactionForCity("mia", tx)
  );
  const nycMiningClaimTransactions = miningClaimTransactions.filter((tx) =>
    checkTransactionForCity("nyc", tx)
  );
  return { miaMiningClaimTransactions, nycMiningClaimTransactions };
});

export const miningBlocksToClaimPerCityAtom = atom((get) => {
  console.log("SETTING UP MINING BLOCKS TO CLAIM");
  const { miaMiningTransactions, nycMiningTransactions } = get(
    miningTransactionsPerCityAtom
  );
  console.log(
    "mining txs per city",
    miaMiningTransactions.length,
    nycMiningTransactions.length
  );
  const { miaMiningClaimTransactions, nycMiningClaimTransactions } = get(
    miningClaimTransactionsPerCityAtom
  );
  console.log(
    "mining claim txs per city",
    miaMiningClaimTransactions.length,
    nycMiningClaimTransactions.length
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
  // create an object with any block heights in mining that are not in mining claims
  const miaBlockHeights = miaBlockHeightsFromMining.filter(
    (height) => !miaBlockHeightsFromMiningClaims.includes(height)
  );
  const nycBlockHeights = nycBlockHeightsFromMining.filter(
    (height) => !nycBlockHeightsFromMiningClaims.includes(height)
  );
  console.log("MIA block heights:");
  console.log(
    miaBlockHeightsFromMining.length,
    " - ",
    miaBlockHeightsFromMiningClaims.length,
    " = ",
    miaBlockHeights.length
  );
  console.log("NYC block heights: ");
  console.log(
    nycBlockHeightsFromMining.length,
    " - ",
    nycBlockHeightsFromMiningClaims.length,
    " = ",
    nycBlockHeights.length
  );
  return { miaBlockHeights, nycBlockHeights };
});

// STACKING TRANSACTIONS

const stackingTransactionCalls: ContractFunctionMap = {
  [miaCoreV1]: "stack-tokens",
  [miaCoreV2]: "stack-tokens",
  [nycCoreV1]: "stack-tokens",
  [nycCoreV2]: "stack-tokens",
  [ccd007Stacking]: "stack",
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
  [miaCoreV1]: "claim-stacking-reward",
  [miaCoreV2]: "claim-stacking-reward",
  [nycCoreV1]: "claim-stacking-reward",
  [nycCoreV2]: "claim-stacking-reward",
  [ccd007Stacking]: "claim-stacking-reward",
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

// iterate since they use same function name
const votingTransactionCalls: ContractFunctionMap = Object.fromEntries(
  votingContracts.map((contract) => [contract, "vote-on-proposal"])
);

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
