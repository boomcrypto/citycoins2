import { atomWithStorage } from "jotai/utils";

/////////////////////////
// CONSTANTS
/////////////////////////

export const API_URL = "https://protocol.citycoins.co/api/";
export const LEGACY_API_URL = "https://api.citycoins.co";

/////////////////////////
// LOCAL STORAGE ATOMS
/////////////////////////

export const activeTabAtom = atomWithStorage<number>(
  "citycoins-ui-activeTab",
  0
);
