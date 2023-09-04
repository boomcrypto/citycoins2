import { atomWithStorage } from "jotai/utils";

/////////////////////////
// CONSTANTS
/////////////////////////

export const apiUrl = "https://protocol.citycoins.co/api/";
export const legacyApiUrl = "https://api.citycoins.co";

/////////////////////////
// LOCAL STORAGE ATOMS
// updated by components
// used to persist on close/open
/////////////////////////

export const activeTabAtom = atomWithStorage<number>(
  "citycoins-ui-activeTab",
  0
);

// stacks address from wallet
export const stxAddressAtom = atomWithStorage<string | null>(
  "citycoins-ui-stxAddress",
  null
);

/////////////////////////
// ATOMS
// updated by components
// used to trigger API calls
/////////////////////////

// TBD

/////////////////////////
// LOADABLE ASYNC ATOMS
// updated by API calls
/////////////////////////

// TBD
