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
import { fetchCitycoinsRewardCycleAtom } from "../../store/citycoins";

function SignIn(props: { variant?: string }) {
  const { openAuthRequest, isRequestPending } = useAuth();
  const clearUserData = useClearUserData();
  const [stxAddress, setStxAddress] = useAtom(stxAddressAtom);
  const fetchBnsName = useSetAtom(fetchBnsNameAtom);
  const fetchAccountBalances = useSetAtom(fetchAccountBalancesAtom);
  const fetchStacksRewardCycle = useSetAtom(fetchStacksRewardCycleAtom);
  const fetchCitycoinsRewardCycle = useSetAtom(fetchCitycoinsRewardCycleAtom);

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
              fetchCitycoinsRewardCycle();
            }
          },
          onCancel: () => {
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
