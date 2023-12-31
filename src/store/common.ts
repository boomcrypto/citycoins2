import { atomWithStorage } from "jotai/utils";
import { Loadable } from "jotai/vanilla/utils/loadable";

/////////////////////////
// CONSTANTS
/////////////////////////

export const CC_API = "https://protocol.citycoins.co/api/";
export const CC_API_LEGACY = "https://api.citycoins.co";
export const HIRO_API = "https://api.hiro.so";

// TYPES

export type VoteStatus = "pending" | "active" | "passed" | "failed";

export type LoadableDataset<T> = {
  isLoading: boolean;
  hasError: boolean;
  hasData: boolean;
  error?: unknown;
  data?: T;
};

/////////////////////////
// LOCAL STORAGE ATOMS
/////////////////////////

export const activeTabAtom = atomWithStorage<number>(
  "citycoins-ui-activeTab",
  5 // temporarily set to voting tab, default: 0
);

// HELPER FUNCTIONS

export function extractLoadableState<T>(loadedAtom: Loadable<T>) {
  const isLoading = loadedAtom.state === "loading";
  const hasError = loadedAtom.state === "hasError" && "error" in loadedAtom;
  const hasData = loadedAtom.state === "hasData";

  const error = hasError ? loadedAtom.error : undefined;
  const data = hasData ? loadedAtom.data : undefined;

  return { isLoading, hasError, hasData, error, data };
}

export function formatMicroAmount(
  amount: number,
  decimalsToDivide: number = 6,
  decimalsToDisplay: number = 0
): string {
  const amountInMicroStacks = amount / 10 ** decimalsToDivide;
  return amountInMicroStacks.toLocaleString(navigator.language, {
    minimumFractionDigits: decimalsToDisplay,
    maximumFractionDigits: decimalsToDisplay,
  });
}
