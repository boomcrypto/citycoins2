import { atomWithStorage } from "jotai/utils";

/////////////////////////
// TYPES
/////////////////////////

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const stxBlock = atomWithStorage<number | null>(
  "citycoins-stacks-stxBlock",
  null
);
export const btcBlock = atomWithStorage<number | null>(
  "citycoins-stacks-btcBlock",
  null
);

export const stxAddressAtom = atomWithStorage<string | null>(
  "citycoins-stacks-stxAddress",
  null
);

export const bnsNameAtom = atomWithStorage<string | null>(
  "citycoins-stacks-bnsName",
  null
);

export const acctTxsAtom = atomWithStorage("citycoins-stacks-acctTxs", null);

export const acctMempoolTxsAtom = atomWithStorage(
  "citycoins-stacks-acctMempoolTxs",
  null
);

export const acctBalancesAtom = atomWithStorage(
  "citycoins-stacks-acctBalances",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

// TBD

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

// TBD

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// TBD
