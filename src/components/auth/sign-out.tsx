import { Button } from "@chakra-ui/react";
import { useAuth } from "@micro-stacks/react";

function SignOut(props: { variant?: string }) {
  const { signOut } = useAuth();
  return (
    <Button
      variant={props.variant || "solid"}
      title="Sign Out"
      onClick={() => {
        // sign out of the wallet
        try {
          signOut();
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
