import { Button } from "@chakra-ui/react";
import { disconnect } from "@stacks/connect";
import { useSetAtom } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import { verificationProgressAtom } from "../../store/verification";

/**
 * Disconnects the wallet without touching cached per-address data. The
 * dedicated "Clear Data" button is the explicit path for wiping the
 * connected wallet's slice; signing out alone preserves it so the user
 * can reconnect with the same wallet later and pick up their cached
 * transactions / user IDs / pending claims without a fresh re-fetch.
 */
function SignOut(props: { variant?: string }) {
  const setStxAddress = useSetAtom(stxAddressAtom);
  const setVerificationProgress = useSetAtom(verificationProgressAtom);
  return (
    <Button
      variant={props.variant || "solid"}
      title="Sign Out"
      onClick={() => {
        try {
          disconnect();
          // Reset any in-flight verification UI so the prior account's
          // progress banner doesn't linger while the running loop notices
          // the address change and breaks.
          setVerificationProgress({
            isRunning: false,
            type: null,
            city: null,
            current: 0,
            total: 0,
            currentItem: "",
          });
          setStxAddress(null);
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
