import { atomWithStorage } from "jotai/utils";
import { fetchCoreApiInfo } from "micro-stacks/api";
import { HIRO_API } from "./common";
import { atom } from "jotai";

/////////////////////////
// TYPES
/////////////////////////

type BlockHeights = {
  btc: number;
  stx: number;
};

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const blockHeightsAtom = atomWithStorage<BlockHeights | null>(
  "citycoins-stacks-blocks",
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

export const blockHeightsQueryAtom = atom(async () => {
  return await getBlockHeights();
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

async function getBlockHeights(): Promise<BlockHeights | undefined> {
  try {
    const v2InfoResponse = await fetchCoreApiInfo({
      url: HIRO_API,
    });
    const blockHeights: BlockHeights = {
      btc: v2InfoResponse.burn_block_height,
      stx: v2InfoResponse.stacks_tip_height,
    };
    return blockHeights;
  } catch (error) {
    throw new Error(`Failed to fetch v2-info in micro-stacks: ${error}`);
  }
}
