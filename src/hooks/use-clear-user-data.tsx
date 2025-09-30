import { useCallback } from "react";
import { WritableAtom } from "jotai";
import { RESET, useAtomCallback } from "jotai/utils";
import { commonLocalStorageAtoms } from "../store/common";
import { stacksLocalStorageAtoms } from "../store/stacks";
import { ccip016LocalStorageAtoms } from "../store/ccip-016";

type AnyWritableAtom = WritableAtom<any, any, any>;

export const useClearUserData = () => {
  const clearData = useAtomCallback(
    useCallback((get, set) => {
      const resetAtom = (atom: AnyWritableAtom) => {
        set(atom, RESET);
      };

      // combine all localstorage atoms
      const allLocalStorageAtoms = [
        ...ccip016LocalStorageAtoms,
        ...commonLocalStorageAtoms,
        ...stacksLocalStorageAtoms,
      ];

      // reset all localstorage atoms
      allLocalStorageAtoms.forEach(resetAtom);

      // Explicitly clear transactions and timestamp
      set(acctTxsAtom, '');
      set(txsTimestampAtom, 0);
      set(userIdsAtom, {});
      set(acctMempoolTxsAtom, []);
    }, [])
  );

  return clearData;
};
