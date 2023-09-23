/////////////////////////
// TYPES
/////////////////////////

import { atom } from "jotai";
import { CC_API, fetchJson } from "./common";
import { atomFamily, atomWithStorage } from "jotai/utils";

type MiningStats = {
  miners: number;
  amount: number;
  claimed: boolean;
};

type Miners = {
  commit: number;
  low: number;
  high: number;
  winner: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccd006-citycoin-mining-v2";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const miningStatsAtom = atomWithStorage<MiningStats | null>(
  "citycoins-miningStats",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const miningStatsQueryAtomFamily = atomFamily(
  ({ cityId, blockHeight }: { cityId: number; blockHeight: number }) =>
    atom(async (): Promise<MiningStats> => {
      return await getMiningStats(cityId, blockHeight);
    })
);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// mine: return contract call

// claim-mining-reward: return contract call

// get-mining-stats
export async function getMiningStats(
  cityId: number,
  blockHeight: number
): Promise<MiningStats> {
  const url = new URL("ccd006-citycoin-mining-v2/get-mining-stats", CC_API);
  url.searchParams.set("height", String(blockHeight));
  url.searchParams.set("city", String(cityId));
  try {
    const miningStats = await fetchJson<MiningStats>(url.toString());
    return miningStats;
  } catch (error) {
    throw new Error(
      `getMiningStats: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}

// has-mined-at-block

// get-miner

// get-block-winner

// is-block-winner
