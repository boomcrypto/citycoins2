import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip022Atoms,
  ccip022IsExecutableQueryAtom,
  ccip022IsVoteActiveQueryAtom,
  ccip022VoteTotalsQueryAtom,
  ccip022VoterInfoQueryAtom,
} from "../store/ccip-022";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip022VoteData = (
  selector: Ccip022Atoms
): LoadableDataset<any> => {
  const ccip022IsExecutableLoader = loadable(ccip022IsExecutableQueryAtom);
  const ccip022IsVoteActiveLoader = loadable(ccip022IsVoteActiveQueryAtom);
  const ccip022VoteTotalsLoader = loadable(ccip022VoteTotalsQueryAtom);
  const ccip022VoterInfoLoader = loadable(ccip022VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip022IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip022IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip022VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip022VoterInfoLoader)[0]);

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
