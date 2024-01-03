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
    atom(async () => {
      return await getMiningStats(cityId, blockHeight);
    })
);

export const minerStatsQueryAtomFamily = atomFamily(
  ({
    cityId,
    blockHeight,
    address,
  }: {
    cityId: number;
    blockHeight: number;
    address: string;
  }) =>
    atom(async () => {
      return await getMiner(cityId, blockHeight, address);
    })
);

export const hasMinedQueryAtomFamily = atomFamily(
  ({ cityId, blockHeight }: { cityId: number; blockHeight: number }) =>
    atom(async () => {
      return await hasMinedAtBlock(cityId, blockHeight);
    })
);

export const blockWinnerQueryAtomFamily = atomFamily(
  ({ cityId, blockHeight }: { cityId: number; blockHeight: number }) =>
    atom(async () => {
      return await getBlockWinner(cityId, blockHeight);
    })
);

export const isBlockWinnerQueryAtomFamily = atomFamily(
  ({
    cityId,
    blockHeight,
    address,
  }: {
    cityId: number;
    blockHeight: number;
    address: string;
  }) =>
    atom(async () => {
      return await isBlockWinner(cityId, blockHeight, address);
    })
);

export const hasMinedAtBlockQueryAtomFamily = atomFamily(
  ({ cityId, blockHeight }: { cityId: number; blockHeight: number }) =>
    atom(async () => {
      return await hasMinedAtBlock(cityId, blockHeight);
    })
);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// get-user-id
export async function getUserId(address: string): Promise<number> {
  const url = new URL("ccd003-user-registry/get-user-id", CC_API);
  url.searchParams.set("user", address);
  try {
    const userId = await fetchJson<number>(url.toString());
    return userId;
  } catch (error) {
    throw new Error(
      `getUserId: Failed to fetch data for address ${address}. Error: ${String(
        error
      )}`
    );
  }
}

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
export async function hasMinedAtBlock(
  cityId: number,
  blockHeight: number
): Promise<boolean> {
  const url = new URL("ccd006-citycoin-mining-v2/has-mined-at-block", CC_API);
  url.searchParams.set("height", String(blockHeight));
  url.searchParams.set("city", String(cityId));
  try {
    const hasMined = await fetchJson<boolean>(url.toString());
    return hasMined;
  } catch (error) {
    throw new Error(
      `hasMinedAtBlock: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}

// get-miner
export async function getMiner(
  cityId: number,
  blockHeight: number,
  address: string
): Promise<Miners> {
  try {
    const userId = await getUserId(address);
    const url = new URL("ccd006-citycoin-mining-v2/get-miner", CC_API);
    url.searchParams.set("height", String(blockHeight));
    url.searchParams.set("cityId", String(cityId));
    url.searchParams.set("userId", String(userId));
    const miner = await fetchJson<Miners>(url.toString());
    return miner;
  } catch (error) {
    throw new Error(
      `getMiner: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}

// get-block-winner
export async function getBlockWinner(
  cityId: number,
  blockHeight: number
): Promise<number | undefined> {
  const url = new URL("ccd006-citycoin-mining-v2/get-block-winner", CC_API);
  url.searchParams.set("height", String(blockHeight));
  url.searchParams.set("cityId", String(cityId));
  try {
    const blockWinner = await fetchJson<number>(url.toString());
    return blockWinner;
  } catch (error) {
    throw new Error(
      `getBlockWinner: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}

// is-block-winner
export async function isBlockWinner(
  cityId: number,
  blockHeight: number,
  address: string
): Promise<boolean> {
  const url = new URL("ccd006-citycoin-mining-v2/is-block-winner", CC_API);
  url.searchParams.set("height", String(blockHeight));
  url.searchParams.set("cityId", String(cityId));
  url.searchParams.set("user", address);
  try {
    const isWinner = await fetchJson<boolean>(url.toString());
    return isWinner;
  } catch (error) {
    throw new Error(
      `isBlockWinner: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}
