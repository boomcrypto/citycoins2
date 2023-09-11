import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
  Ccip017Atoms,
  ccip017IsExecutableQueryAtom,
  ccip017IsVoteActiveQueryAtom,
  ccip017VoteTotalsQueryAtom,
  ccip017VoterInfoQueryAtom,
} from "../store/ccip-017";
import { LoadableDataset, extractLoadableState } from "../constants";

export const useCcip017 = (selector: Ccip017Atoms): LoadableDataset<any> => {
  const ccip017IsExecutableLoader = loadable(ccip017IsExecutableQueryAtom);
  const ccip017IsVoteActiveLoader = loadable(ccip017IsVoteActiveQueryAtom);
  const ccip017VoteTotalsLoader = loadable(ccip017VoteTotalsQueryAtom);
  const ccip017VoterInfoLoader = loadable(ccip017VoterInfoQueryAtom);

  const isExecutable = extractLoadableState(
    useAtom(ccip017IsExecutableLoader)[0]
  );
  const isVoteActive = extractLoadableState(
    useAtom(ccip017IsVoteActiveLoader)[0]
  );
  const voteTotals = extractLoadableState(useAtom(ccip017VoteTotalsLoader)[0]);
  const voterInfo = extractLoadableState(useAtom(ccip017VoterInfoLoader)[0]);

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
