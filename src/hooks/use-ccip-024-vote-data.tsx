import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip024Atoms,
  ccip024IsExecutableQueryAtom,
  ccip024IsVoteActiveQueryAtom,
  ccip024VoteTotalsQueryAtom,
  ccip024VoterInfoQueryAtom,
} from "../store/ccip-024";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip024VoteData = (
  selector: Ccip024Atoms
): LoadableDataset<any> => {
  const ccip024IsExecutableLoader = loadable(ccip024IsExecutableQueryAtom);
  const ccip024IsVoteActiveLoader = loadable(ccip024IsVoteActiveQueryAtom);
  const ccip024VoteTotalsLoader = loadable(ccip024VoteTotalsQueryAtom);
  const ccip024VoterInfoLoader = loadable(ccip024VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip024IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip024IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip024VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip024VoterInfoLoader)[0]);

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
