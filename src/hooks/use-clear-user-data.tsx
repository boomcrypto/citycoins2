import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { activeTabAtom } from "../constants";
import {
  acctBalancesAtom,
  acctMempoolTxsAtom,
  acctTxsAtom,
  blockHeightsAtom,
  bnsNameAtom,
  stxAddressAtom,
} from "../store/stacks";
import {
  ccip017HasVotedAtom,
  ccip017IsExecutableAtom,
  ccip017IsVoteActiveAtom,
  ccip017VoteTotalsAtom,
  ccip017VoterInfoAtom,
} from "../store/ccip-017";

export const useClearUserData = () => {
  // constants.ts
  const setActiveTab = useSetAtom(activeTabAtom);
  // store/stacks.ts
  const setBlockHeights = useSetAtom(blockHeightsAtom);
  const setStxAddress = useSetAtom(stxAddressAtom);
  const setBnsName = useSetAtom(bnsNameAtom);
  const setAcctTxs = useSetAtom(acctTxsAtom);
  const setAcctMempoolTxs = useSetAtom(acctMempoolTxsAtom);
  const setAcctBalances = useSetAtom(acctBalancesAtom);
  // store/ccip-017.ts
  const setCcip017IsExecutable = useSetAtom(ccip017IsExecutableAtom);
  const setCcip017IsVoteActive = useSetAtom(ccip017IsVoteActiveAtom);
  const setCcip017VoteTotals = useSetAtom(ccip017VoteTotalsAtom);
  const setCcip017VoterInfo = useSetAtom(ccip017VoterInfoAtom);
  const setCcip017HasVoted = useSetAtom(ccip017HasVotedAtom);

  const clearData = () => {
    // clear all locally stored data
    setActiveTab(RESET);
    setBlockHeights(RESET);
    setStxAddress(RESET);
    setBnsName(RESET);
    setAcctTxs(RESET);
    setAcctMempoolTxs(RESET);
    setAcctBalances(RESET);
    setCcip017IsExecutable(RESET);
    setCcip017IsVoteActive(RESET);
    setCcip017VoteTotals(RESET);
    setCcip017VoterInfo(RESET);
    setCcip017HasVoted(RESET);
  };

  return clearData;
};
