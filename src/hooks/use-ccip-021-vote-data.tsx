import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip021Atoms,
  ccip021IsExecutableQueryAtom,
  ccip021IsVoteActiveQueryAtom,
  ccip021VoteTotalsQueryAtom,
  ccip021VoterInfoQueryAtom,
} from "../store/ccip-021";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip021VoteData = (
  selector: Ccip021Atoms
): LoadableDataset<any> => {
  const ccip021IsExecutableLoader = loadable(ccip021IsExecutableQueryAtom);
  const ccip021IsVoteActiveLoader = loadable(ccip021IsVoteActiveQueryAtom);
  const ccip021VoteTotalsLoader = loadable(ccip021VoteTotalsQueryAtom);
  const ccip021VoterInfoLoader = loadable(ccip021VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip021IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip021IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip021VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip021VoterInfoLoader)[0]);

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
