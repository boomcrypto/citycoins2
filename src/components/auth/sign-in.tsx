import { Button } from "@chakra-ui/react";
import { useAuth } from "@micro-stacks/react";
import { useAtom } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import { useClearUserData } from "../../hooks/use-clear-user-data";

function SignIn(props: { variant?: string }) {
  const { openAuthRequest, isRequestPending } = useAuth();
  const clearUserData = useClearUserData();
  const [stxAddress, setStxAddress] = useAtom(stxAddressAtom);

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
