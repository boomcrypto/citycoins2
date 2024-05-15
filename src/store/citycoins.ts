// DERIVED ATOMS FOR TRANSACTIONS

import { transactionsAtom } from "./stacks";
import { atom } from "jotai";

type ContractFunctionMap = {
  [contract: string]: string;
};

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

// function to check if the contract name exists
function checkMiningContract(contractName: string): boolean {
  return miningTransactionCalls.hasOwnProperty(contractName);
}

// function to check if the function name matches for a given contract
function checkMiningFunctionName(
  contractName: string,
  functionName: string
): boolean {
  return miningTransactionCalls[contractName] === functionName;
}

export const miningTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkMiningContract(tx.contract_call.contract_id) &&
        checkMiningFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name
        )
    );
  }
);
