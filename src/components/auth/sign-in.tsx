import { Button } from "@chakra-ui/react";
import { useAuth } from "@micro-stacks/react";
import { useAtom, useSetAtom } from "jotai";
import {
  fetchAccountBalancesAtom,
  fetchBnsNameAtom,
  fetchStacksRewardCycleAtom,
  stxAddressAtom,
} from "../../store/stacks";
import { useClearUserData } from "../../hooks/use-clear-user-data";
import {
  fetchCitycoinsRewardCycleAtom,
  fetchCitycoinsUserIdsAtom,
} from "../../store/citycoins";

function SignIn(props: { variant?: string }) {
  const { openAuthRequest, isRequestPending } = useAuth();
  const clearUserData = useClearUserData();
  const [stxAddress, setStxAddress] = useAtom(stxAddressAtom);
  const fetchBnsName = useSetAtom(fetchBnsNameAtom);
  const fetchAccountBalances = useSetAtom(fetchAccountBalancesAtom);
  const fetchStacksRewardCycle = useSetAtom(fetchStacksRewardCycleAtom);
  const fetchCitycoinsRewardCycle = useSetAtom(fetchCitycoinsRewardCycleAtom);
  const fetchCitycoinsUserIds = useSetAtom(fetchCitycoinsUserIdsAtom);

  return (
    <Button
      variant={props.variant || "solid"}
      title="Connect Wallet"
      isLoading={isRequestPending}
      onClick={() =>
        void openAuthRequest({
          onFinish: (session) => {
            if (session.addresses.mainnet !== stxAddress) {
              // clear locally stored data
              clearUserData();
              // set STX address
              setStxAddress(session.addresses.mainnet);
              // fetch STX data
              fetchBnsName();
              fetchAccountBalances();
              fetchStacksRewardCycle();
              // fetch CityCoins data
              fetchCitycoinsRewardCycle();
              fetchCitycoinsUserIds();
            }
          },
          onCancel: () => {
            // TODO: add yummy toast
            // console.log("sign-in: user cancelled auth request");
          },
        })
      }
    >
      Connect Wallet
    </Button>
  );
}

export default SignIn;
