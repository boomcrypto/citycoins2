import { loadable } from "jotai/utils";
import { blockHeightsQueryAtom } from "../store/stacks";
import { extractLoadableState } from "../store/common";
import { useAtom } from "jotai";

export const useBlockHeights = () => {
  const blockHeightsLoader = loadable(blockHeightsQueryAtom);
  const blockHeights = extractLoadableState(useAtom(blockHeightsLoader)[0]);
  return blockHeights;
};
