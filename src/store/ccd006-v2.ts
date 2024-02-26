/////////////////////////
// TYPES
/////////////////////////

import { atom } from "jotai";
import { CC_API, fetchJson } from "./common";
import { atomFamily, atomWithStorage, loadable } from "jotai/utils";

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

type BlockWinner = {
  winner: boolean;
  claimed: boolean;
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

export const miningClaimListAtom = atomWithStorage<number[]>(
  "citycoins-cc-miningClaimList",
  []
);

// create an atom family to create a storage entry per block
export const isBlockWinnerAtomFamily = atomFamily((blockHeight: number) =>
  atomWithStorage<BlockWinner | null>(
    `citycoins-cc-isBlockWinner-${blockHeight}`,
    null
  )
);

export type ParamsAddressCityBlock = {
  address: string;
  cityId: number;
  blockHeight: number;
};

// atom for locally stored value
// returns null or set value
export const localBlockWinnerAtomFamily = atomFamily(
  // atom: read
  ({ cityId, blockHeight, address }: ParamsAddressCityBlock) =>
    atomWithStorage<BlockWinner | null>(
      `citycoins-cc-isBlockWinner-${address}-${cityId}-${blockHeight}`,
      null
    )
);

// atom to fetch the related data
// can be wrapped in loadable util
// can be reacted to in components
export const fetchIsBlockWinnerAtomFamily = atomFamily(
  // atom: read
  ({ address, cityId, blockHeight }: ParamsAddressCityBlock) =>
    atom(async () => {
      return await isBlockWinner(cityId, blockHeight, address);
    })
);

export const derivedIsBlockWinnerAtomFamily = atomFamily(
  ({ address, cityId, blockHeight }: ParamsAddressCityBlock) =>
    atom(
      // atom: read
      (get) => {
        // return local data if found
        const localData = get(
          localBlockWinnerAtomFamily({ cityId, blockHeight, address })
        );
        if (localData !== null) {
          console.log("derivedIsBlockWinnerAtomFamily: localData found");
          return Promise.resolve(localData);
        }
        // fetch and return the data if not found
        console.log(
          "derivedIsBlockWinnerAtomFamily: localData not found, fetching data"
        );
        const fetchAtom = fetchIsBlockWinnerAtomFamily({
          address,
          cityId,
          blockHeight,
        });
        return get(fetchAtom);
      },
      // atom: write
      (_, set, newValue: BlockWinner) => {
        // set the local storage value
        set(
          localBlockWinnerAtomFamily({ cityId, blockHeight, address }),
          newValue
        );
      }
    )
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const miningStatsQueryAtomFamily = atomFamily(
  ({ cityId, blockHeight }: { cityId: number; blockHeight: number }) =>
    atom(async (get) => {
      return await getMiningStats(cityId, blockHeight);
    })
);

export const minerStatsQueryAtomFamily = atomFamily(
  ({
    cityId,
    blockHeight,
    userId,
  }: {
    cityId: number;
    blockHeight: number;
    userId: number;
  }) =>
    atom(async () => {
      return await getMiner(cityId, blockHeight, userId);
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
  url.searchParams.set("cityId", String(cityId));
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
  url.searchParams.set("cityId", String(cityId));
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
  userId: number
): Promise<Miners> {
  try {
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
): Promise<BlockWinner> {
  const url = new URL("ccd006-citycoin-mining-v2/is-block-winner", CC_API);
  url.searchParams.set("claimHeight", String(blockHeight));
  url.searchParams.set("cityId", String(cityId));
  url.searchParams.set("user", address);
  try {
    const isWinner = await fetchJson<BlockWinner>(url.toString());
    return isWinner;
  } catch (error) {
    throw new Error(
      `isBlockWinner: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}
