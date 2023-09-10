import { atomWithStorage } from "jotai/utils";

/////////////////////////
// CONSTANTS
/////////////////////////

export const CC_API = "https://protocol.citycoins.co/api/";
export const CC_API_LEGACY = "https://api.citycoins.co";
export const HIRO_API = "https://api.hiro.so";

/////////////////////////
// LOCAL STORAGE ATOMS
/////////////////////////

export const activeTabAtom = atomWithStorage<number>(
  "citycoins-ui-activeTab",
  0
);
