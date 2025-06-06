import { Button } from "@chakra-ui/react";
import { connect, getLocalStorage } from "@stacks/connect";
import { stxAddressAtom } from "../../store/stacks";
import { useSetAtom } from "jotai";

function SignIn(props: { variant?: string }) {
  const setStxAddress = useSetAtom(stxAddressAtom);
  return (
    <Button
      variant={props.variant || "solid"}
      title="Connect Wallet"
      onClick={async () => {
        await connect();
        const userData = getLocalStorage();
        const stxAddress = userData?.addresses.stx[0].address
        console.log("User Data:", userData);
        console.log("STX Address:", stxAddress);
        setStxAddress(stxAddress || null);
      }}
    >
      Connect Wallet
    </Button >
  );
}

export default SignIn;
