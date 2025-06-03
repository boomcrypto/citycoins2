import { Button } from "@chakra-ui/react";
import { useClearUserData } from "../../hooks/use-clear-user-data";
import { disconnect } from "@stacks/connect";

function ClearData(props: { variant?: string }) {

  const clearUserData = useClearUserData();

  return (
    <Button
      variant={props.variant || "solid"}
      title="Clear Data"
      onClick={() => {
        // clear locally stored data
        clearUserData();
        // sign out of the wallet
        try {
          disconnect();
        } catch (error) {
          console.error("Error while signing out: ", error);
        }
      }}
    >
      Clear Data
    </Button>
  );
}

export default ClearData;
