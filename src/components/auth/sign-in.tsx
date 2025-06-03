import { Button } from "@chakra-ui/react";
import { connect } from "@stacks/connect";

function SignIn(props: { variant?: string }) {

  return (
    <Button
      variant={props.variant || "solid"}
      title="Connect Wallet"
      onClick={() => {
        connect();
      }}
    >
      Connect Wallet
    </Button >
  );
}

export default SignIn;
