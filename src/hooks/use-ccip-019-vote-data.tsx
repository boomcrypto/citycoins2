import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip019Atoms,
  ccip019IsExecutableQueryAtom,
  ccip019IsVoteActiveQueryAtom,
  ccip019VoteTotalsQueryAtom,
  ccip019VoterInfoQueryAtom,
} from "../store/ccip-019";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip019VoteData = (
  selector: Ccip019Atoms
): LoadableDataset<any> => {
  const ccip019IsExecutableLoader = loadable(ccip019IsExecutableQueryAtom);
  const ccip019IsVoteActiveLoader = loadable(ccip019IsVoteActiveQueryAtom);
  const ccip019VoteTotalsLoader = loadable(ccip019VoteTotalsQueryAtom);
  const ccip019VoterInfoLoader = loadable(ccip019VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip019IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip019IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip019VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip019VoterInfoLoader)[0]);

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
