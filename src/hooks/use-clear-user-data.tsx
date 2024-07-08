import { useCallback } from "react";
import { WritableAtom } from "jotai";
import { RESET, useAtomCallback } from "jotai/utils";
import { commonLocalStorageAtoms } from "../store/common";
import { ccd012LocalStorageAtoms } from "../store/ccd-012";
import { ccip017LocalStorageAtoms } from "../store/ccip-017";
import { stacksLocalStorageAtoms } from "../store/stacks";

/*
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
  // store/ccd-012.ts
  const setCcd012V1BalanceNYCLocalAtom = useSetAtom(
    ccd012V1BalanceNYCLocalAtom
  );
  const setCcd012V2BalanceNYCLocalAtom = useSetAtom(
    ccd012V2BalanceNYCLocalAtom
  );
  const setCcd012IsRedemptionEnabledAtom = useSetAtom(
    ccd012IsRedemptionEnabledAtom
  );
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

export const useClearUserDataV2 = () => {
  // reset all local storage atoms
  const clearData = useAtomCallback(
    useCallback((get, set) => {
      const resetAtom = <T,>(atom: WritableAtom<T, any, any>) => {
        set(atom, RESET);
      };
      // store/ccd-012.ts
      resetAtom(ccd012V1BalanceNYCLocalAtom);
      resetAtom(ccd012V2BalanceNYCLocalAtom);
      resetAtom(ccd012IsRedemptionEnabledAtom);
      // store/ccip-017.ts
      resetAtom(ccip017IsExecutableAtom);
      resetAtom(ccip017IsVoteActiveAtom);
      resetAtom(ccip017VoteTotalsAtom);
      resetAtom(ccip017VoterInfoAtom);
      resetAtom(ccip017HasVotedAtom);

      // store/common.ts
      resetAtom(activeTabAtom);
      // store/stacks.ts
      resetAtom(blockHeightsAtom);
      resetAtom(stxAddressAtom);
      resetAtom(bnsNameAtom);
      resetAtom(acctTxsAtom);
      resetAtom(acctMempoolTxsAtom);
      resetAtom(acctBalancesAtom);
    }, [])
  );

  return clearData;
};
*/

type AnyWritableAtom = WritableAtom<any, any, any>;

export const useClearUserData = () => {
  const clearData = useAtomCallback(
    useCallback((get, set) => {
      const resetAtom = (atom: AnyWritableAtom) => {
        set(atom, RESET as any);
      };

      // combine all local storage atoms
      const allLocalStorageAtoms = [
        ...commonLocalStorageAtoms,
        ...stacksLocalStorageAtoms,
        ...ccip017LocalStorageAtoms,
        ...ccd012LocalStorageAtoms,
      ];

      // Reset all atoms
      allLocalStorageAtoms.forEach(resetAtom);
    }, [])
  );

  return clearData;
};
