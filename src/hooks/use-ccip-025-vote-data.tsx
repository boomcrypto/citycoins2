import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip025Atoms,
  ccip025IsExecutableQueryAtom,
  ccip025IsVoteActiveQueryAtom,
  ccip025VoteTotalsQueryAtom,
  ccip025VoterInfoQueryAtom,
} from "../store/ccip-025";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip025VoteData = (
  selector: Ccip025Atoms
): LoadableDataset<any> => {
  const ccip025IsExecutableLoader = loadable(ccip025IsExecutableQueryAtom);
  const ccip025IsVoteActiveLoader = loadable(ccip025IsVoteActiveQueryAtom);
  const ccip025VoteTotalsLoader = loadable(ccip025VoteTotalsQueryAtom);
  const ccip025VoterInfoLoader = loadable(ccip025VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip025IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip025IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip025VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip025VoterInfoLoader)[0]);

  switch (selector) {
    case "isExecutable":
      return isExecutable;
    case "isVoteActive":
      return isVoteActive;
    case "voteTotals":
      return voteTotals;
    case "voterInfo":
      return voterInfo;
  }
};
