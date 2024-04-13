import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip020Atoms,
  ccip020IsExecutableQueryAtom,
  ccip020IsVoteActiveQueryAtom,
  ccip020VoteTotalsQueryAtom,
  ccip020VoterInfoQueryAtom,
} from "../store/ccip-020";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcip020VoteData = (
  selector: Ccip020Atoms
): LoadableDataset<any> => {
  const ccip020IsExecutableLoader = loadable(ccip020IsExecutableQueryAtom);
  const ccip020IsVoteActiveLoader = loadable(ccip020IsVoteActiveQueryAtom);
  const ccip020VoteTotalsLoader = loadable(ccip020VoteTotalsQueryAtom);
  const ccip020VoterInfoLoader = loadable(ccip020VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip020IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip020IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip020VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip020VoterInfoLoader)[0]);

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
