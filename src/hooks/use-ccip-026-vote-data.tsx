import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip026Atoms,
  ccip026IsExecutableQueryAtom,
  ccip026IsVoteActiveQueryAtom,
  ccip026VoteTotalsQueryAtom,
  ccip026VoterInfoQueryAtom,
} from "../store/ccip-026";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip026VoteData = (
  selector: Ccip026Atoms
): LoadableDataset<any> => {
  const ccip026IsExecutableLoader = loadable(ccip026IsExecutableQueryAtom);
  const ccip026IsVoteActiveLoader = loadable(ccip026IsVoteActiveQueryAtom);
  const ccip026VoteTotalsLoader = loadable(ccip026VoteTotalsQueryAtom);
  const ccip026VoterInfoLoader = loadable(ccip026VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip026IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip026IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip026VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip026VoterInfoLoader)[0]);

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
