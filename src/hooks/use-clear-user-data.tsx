import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { stxAddressAtom } from "../constants";

export const useClearUserData = () => {
  const setStxAddress = useSetAtom(stxAddressAtom);

  const clearData = () => {
    // clear all locally stored data
    setStxAddress(RESET);
  };

  return clearData;
};
