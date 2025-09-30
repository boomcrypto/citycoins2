import { Button } from "@chakra-ui/react";
import { disconnect } from "@stacks/connect";
import { useSetAtom } from "jotai";
import { stxAddressAtom, userIdsAtom } from "../../store/stacks";
import { useClearUserData } from "../../hooks/use-clear-user-data";

function SignOut(props: { variant?: string }) {
  const setStxAddress = useSetAtom(stxAddressAtom);
  const clearUserData = useClearUserData();
  return (
    <Button
      variant={props.variant || "solid"}
      title="Sign Out"
      onClick={() => {
        // sign out of the wallet
        try {
          disconnect();
          setStxAddress(null); // Clear the STX address in the store
          clearUserData(); // Clears userIds, txs, etc.
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
