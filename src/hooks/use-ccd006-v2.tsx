import { useMemo } from "react";
import { atom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { extractLoadableState } from "../store/common";
import { stxAddressAtom } from "../store/stacks";
import {
  isBlockWinnerMapAtom,
  isBlockWinnerQueryAtomFamily,
  minerStatsQueryAtomFamily,
  miningStatsQueryAtomFamily,
} from "../store/ccd006-v2";
import { citycoinsUserIdsAtom } from "../store/citycoins";

// return the mining stats
export const useMiningStats = (cityId: number, blockHeight: number) => {
  const address = useAtomValue(stxAddressAtom);
  if (!address) throw new Error("No STX address found");

  // load mining stats at block from contract
  const miningStatsAtom = useMemo(
    () =>
      miningStatsQueryAtomFamily({
        cityId,
        blockHeight,
      }),
    [cityId, blockHeight]
  );
  const loadMiningStats = loadable(miningStatsAtom);
  const miningStats = useAtomValue(loadMiningStats);

  return extractLoadableState(miningStats);
};

// return the miner stats
export const useMinerStats = (cityId: number, blockHeight: number) => {
  const userIds = useAtomValue(citycoinsUserIdsAtom);
  if (!userIds) throw new Error("No user IDs found");
  if (!userIds.ccd003) throw new Error("No CCD003 user ID found");
  const userId = userIds.ccd003;

  // load miner stats at block from contract
  const minerStatsAtom = useMemo(
    () =>
      minerStatsQueryAtomFamily({
        cityId,
        blockHeight,
        userId,
      }),
    [cityId, blockHeight, userId]
  );
  const loadMinerStats = loadable(minerStatsAtom);
  const minerStats = useAtomValue(loadMinerStats);

  return extractLoadableState(minerStats);
};

// return if the user is the winner at the block
export const useIsBlockWinner = (cityId: number, blockHeight: number) => {
  const address = useAtomValue(stxAddressAtom);
  if (!address) throw new Error("No STX address found");

  const localWinnerMap = useAtomValue(isBlockWinnerMapAtom);
  const localData = localWinnerMap.get(blockHeight);

  // Use a simple atom for local data or a query atom family for fetching
  const isBlockWinnerAtom = useMemo(() => {
    if (localData) {
      console.log(`use-ccd006-v2: using local data for ${blockHeight}`);
      // Create a simple atom that just returns the local data
      return atom(Promise.resolve(localData));
    } else {
      console.log(`use-ccd006-v2: fetching onchain data for ${blockHeight}`);
      return isBlockWinnerQueryAtomFamily({
        cityId,
        blockHeight,
        address,
      });
    }
  }, [cityId, blockHeight, address, localData]);

  const loadIsBlockWinner = loadable(isBlockWinnerAtom);
  const isBlockWinner = useAtomValue(loadIsBlockWinner);

  // Use extractLoadableState to normalize the return structure
  return extractLoadableState(isBlockWinner);
};
