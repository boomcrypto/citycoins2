import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip016Atoms,
  ccip016IsExecutableQueryAtom,
  ccip016IsVoteActiveQueryAtom,
  ccip016VoteTotalsQueryAtom,
  ccip016VoterInfoQueryAtom,
} from "../store/ccip-016";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip016VoteData = (
  selector: Ccip016Atoms
): LoadableDataset<any> => {
  const ccip016IsExecutableLoader = loadable(ccip016IsExecutableQueryAtom);
  const ccip016IsVoteActiveLoader = loadable(ccip016IsVoteActiveQueryAtom);
  const ccip016VoteTotalsLoader = loadable(ccip016VoteTotalsQueryAtom);
  const ccip016VoterInfoLoader = loadable(ccip016VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip016IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip016IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip016VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip016VoterInfoLoader)[0]);

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
