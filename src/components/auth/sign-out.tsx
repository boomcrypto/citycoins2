import { Button } from "@chakra-ui/react";
import { disconnect } from "@stacks/connect";
import { useSetAtom } from "jotai";
import { useClearUserData } from "../../hooks/use-clear-user-data";
import { verificationProgressAtom } from "../../store/verification";

function SignOut(props: { variant?: string }) {
  const clearUserData = useClearUserData();
  const setVerificationProgress = useSetAtom(verificationProgressAtom);
  return (
    <Button
      variant={props.variant || "solid"}
      title="Sign Out"
      onClick={() => {
        try {
          disconnect();
          // Reset any in-flight verification UI immediately so the prior
          // account's progress banner doesn't linger while the running loop
          // notices the address change and breaks.
          setVerificationProgress({
            isRunning: false,
            type: null,
            city: null,
            current: 0,
            total: 0,
            currentItem: "",
          });
          // clearUserData wipes the connected wallet's per-address slices and
          // then clears stxAddress, so it must run with the address still set.
          clearUserData();
        } catch (error) {
          console.error("Error while signing out: ", error);
        }
      }}
    >
      Sign Out
    </Button>
  );
}

export default SignOut;
