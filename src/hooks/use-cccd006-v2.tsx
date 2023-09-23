import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { miningStatsQueryAtomFamily } from "../store/ccd006-v2";
import { extractLoadableState } from "../store/common";

export const useCcd006V2 = (cityId: number, blockHeight: number) => {
  const miningStatsAtom = miningStatsQueryAtomFamily({
    cityId,
    blockHeight,
  });
  const loadMiningStats = loadable(miningStatsAtom);
  const miningStats = useAtomValue(loadMiningStats);
  return { miningStats: extractLoadableState(miningStats) };
};

export default useCcd006V2;
