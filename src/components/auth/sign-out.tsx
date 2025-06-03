import { Button } from "@chakra-ui/react";
import { disconnect } from "@stacks/connect";

function SignOut(props: { variant?: string }) {
  return (
    <Button
      variant={props.variant || "solid"}
      title="Sign Out"
      onClick={() => {
        // sign out of the wallet
        try {
          disconnect();
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
