import { Button } from "@chakra-ui/react";
import { useAuth } from "@micro-stacks/react";
import { useClearUserData } from "../../hooks/use-clear-user-data";

function ClearData(props: { colorScheme?: string; variant?: string }) {
  const { signOut } = useAuth();
  const clearUserData = useClearUserData();

  return (
    <Button
      variant={props.variant || "solid"}
      colorScheme={props.colorScheme || "gray"}
      title="Clear Data"
      onClick={() => {
        // clear locally stored data
        clearUserData();
        // sign out of the wallet
        try {
          signOut();
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
