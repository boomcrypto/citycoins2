import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { activeTabAtom } from "../store/common";
import {
  blockHeightsAtom,
  stacksRewardCycleAtom,
  stxAddressAtom,
  bnsNameAtom,
  acctTxsAtom,
  acctMempoolTxsAtom,
  accountBalancesAtom,
} from "../store/stacks";
import {
  citycoinsRewardCycleAtom,
  citycoinsSelectedCityAtom,
} from "../store/citycoins";

export const useClearUserData = () => {
  // constants.ts
  const setActiveTab = useSetAtom(activeTabAtom);
  // store/stacks.ts
  const setBlockHeights = useSetAtom(blockHeightsAtom);
  const setStacksRewardCycle = useSetAtom(stacksRewardCycleAtom);
  const setStxAddress = useSetAtom(stxAddressAtom);
  const setBnsName = useSetAtom(bnsNameAtom);
  const setAcctTxs = useSetAtom(acctTxsAtom);
  const setAcctMempoolTxs = useSetAtom(acctMempoolTxsAtom);
  const setaccountBalances = useSetAtom(accountBalancesAtom);
  // store/citycoins.ts
  const setCitycoinsRewardCycle = useSetAtom(citycoinsRewardCycleAtom);
  const setCitycoinsSelectedCity = useSetAtom(citycoinsSelectedCityAtom);

  const clearData = () => {
    // constants.ts
    setActiveTab(RESET);
    // store/stacks.ts
    setBlockHeights(RESET);
    setStacksRewardCycle(RESET);
    setStxAddress(RESET);
    setBnsName(RESET);
    setAcctTxs(RESET);
    setAcctMempoolTxs(RESET);
    setaccountBalances(RESET);
    // store/citycoins.ts
    setCitycoinsRewardCycle(RESET);
    setCitycoinsSelectedCity(RESET);
  };

  return clearData;
};
