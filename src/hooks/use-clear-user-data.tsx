import { useCallback } from "react";
import { WritableAtom } from "jotai";
import { RESET, useAtomCallback } from "jotai/utils";
import { ccd012LocalStorageAtoms } from "../store/ccd-012";
import { ccip017LocalStorageAtoms } from "../store/ccip-017";
import { ccip020LocalStorageAtoms } from "../store/ccip-020";
import { ccip021LocalStorageAtoms } from "../store/ccip-021";
import { ccip022LocalStorageAtoms } from "../store/ccip-022";
import { commonLocalStorageAtoms } from "../store/common";
import { stacksLocalStorageAtoms } from "../store/stacks";

type AnyWritableAtom = WritableAtom<any, any, any>;

export const useClearUserData = () => {
  const clearData = useAtomCallback(
    useCallback((get, set) => {
      const resetAtom = (atom: AnyWritableAtom) => {
        set(atom, RESET);
      };

      // combine all localstorage atoms
      const allLocalStorageAtoms = [
        ...ccd012LocalStorageAtoms,
        ...ccip017LocalStorageAtoms,
        ...ccip020LocalStorageAtoms,
        ...ccip021LocalStorageAtoms,
        ...ccip022LocalStorageAtoms,
        ...commonLocalStorageAtoms,
        ...stacksLocalStorageAtoms,
      ];

      // reset all localstorage atoms
      allLocalStorageAtoms.forEach(resetAtom);
    }, [])
  );

  return clearData;
};
