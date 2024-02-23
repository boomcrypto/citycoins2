import { atom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import {
  getMiningStats,
  minerStatsQueryAtomFamily,
  miningStatsQueryAtomFamily,
} from "../store/ccd006-v2";
import { extractLoadableState } from "../store/common";
import { stxAddressAtom } from "../store/stacks";
import { useMemo } from "react";
import { citycoinsUserIdsAtom } from "../store/citycoins";

// split into individual items, easier debugging
// useMiningStats
// useMinerStats
// all ccd006 related
export const useMiningStats = (cityId: number, blockHeight: number) => {
  const address = useAtomValue(stxAddressAtom);
  if (!address) throw new Error("No STX address found");

  // load mining stats at block
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

export const useMinerStats = (cityId: number, blockHeight: number) => {
  const userIds = useAtomValue(citycoinsUserIdsAtom);
  if (!userIds) throw new Error("No user IDs found");
  if (!userIds.ccd003) throw new Error("No CCD003 user ID found");
  const userId = userIds.ccd003;

  // load miner stats at block
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
