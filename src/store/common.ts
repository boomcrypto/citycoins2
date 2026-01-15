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

export const activeTabAtom = atomWithStorage<string>(
  "citycoins-ui-activeTab",
  "mia" // default: MIA tab
);

export const commonLocalStorageAtoms = [activeTabAtom];

// HELPER FUNCTIONS

export function extractLoadableState<T>(loadedAtom: Loadable<T>) {
  const isLoading = loadedAtom.state === "loading";
  const hasError = loadedAtom.state === "hasError" && "error" in loadedAtom;
  const hasData = loadedAtom.state === "hasData";

  const error = hasError ? loadedAtom.error : undefined;
  const data = hasData ? loadedAtom.data : undefined;

  return { isLoading, hasError, hasData, error, data };
}

export function formatAmount(amount: number) {
  return amount.toLocaleString(navigator.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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

/**
 * Formats an ISO string into a human-readable date string.
 * @param isoString The ISO string to format.
 * @returns The formatted date string.
 */
export function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

/**
 * Asynchronous sleep function.
 * @param ms The number of milliseconds to sleep.
 */
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fancy fetch function that retries on failure.
 * @param url The URL to fetch from.
 * @param json Whether to parse the response as JSON or text.
 * @param retries (default: 3) The maximum number of retries to attempt.
 * @param attempts (default: 1) The current attempt number.
 * @returns The response data with the provided type T.
 */
export async function fancyFetch<T>(
  url: string,
  json = true,
  retries = 3,
  attempts = 1
): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from ${url}: ${response.status}, ${response.statusText}`
      );
    }
    const responseData: T = json
      ? await response.json()
      : await response.text();
    return responseData;
  } catch (error) {
    if (attempts < retries) {
      console.log(`(${attempts}) Retrying fetch in 5 seconds... (${error})`);
      await sleep(5000);
      return fancyFetch(url, json, retries, attempts + 1);
    } else {
      throw error;
    }
  }
}
