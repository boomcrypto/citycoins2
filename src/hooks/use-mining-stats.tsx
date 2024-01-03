import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import {
  minerStatsQueryAtomFamily,
  miningStatsQueryAtomFamily,
} from "../store/ccd006-v2";
import { extractLoadableState } from "../store/common";
import { stxAddressAtom } from "../store/stacks";

export const useMiningStats = (cityId: number, blockHeight: number) => {
  const address = useAtomValue(stxAddressAtom);
  if (!address) throw new Error("No STX address found");

  // load mining stats at block
  const miningStatsAtom = miningStatsQueryAtomFamily({
    cityId,
    blockHeight,
  });
  const loadMiningStats = loadable(miningStatsAtom);
  const miningStats = useAtomValue(loadMiningStats);

  // load miner stats at block
  const minerStatsAtom = minerStatsQueryAtomFamily({
    cityId,
    blockHeight,
    address,
  });
  const loadMinerStats = loadable(minerStatsAtom);
  const minerStats = useAtomValue(loadMinerStats);

  return {
    miningStats: extractLoadableState(miningStats),
    minerStats: extractLoadableState(minerStats),
  };
};

export default useMiningStats;
