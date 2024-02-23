import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { blockHeightsAtom } from "./stacks";
import { REWARD_DELAY } from "./citycoins";

export const blockSelectionAtom = atom("single");

export const miningClaimListAtom = atomWithStorage<number[]>(
  "citycoins-cc-miningClaimList",
  []
);

export const startBlockHeightAtom = atom(
  (get) => {
    const blockHeight = get(blockHeightsAtom);
    if (blockHeight) {
      return blockHeight.stx - REWARD_DELAY;
    }
    return 0;
  },
  (_, set, update) => {
    set(startBlockHeightAtom, update);
  }
);

export const endBlockHeightAtom = atom(0);
