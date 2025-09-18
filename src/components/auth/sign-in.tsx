import { Button } from "@chakra-ui/react";
import { connect, getLocalStorage } from "@stacks/connect";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import { useAtom, useSetAtom } from "jotai";

function SignIn(props: { variant?: string }) {
  const setStxAddress = useSetAtom(stxAddressAtom);
  const [, updateTransactions] = useAtom(transactionsAtom);
  return (
    <Button
      variant={props.variant || "solid"}
      title="Connect Wallet"
      onClick={async () => {
        await connect();
        const userData = getLocalStorage();
        const stxAddress = userData?.addresses.stx[0].address
        //console.log("User Data:", userData);
        //console.log("STX Address:", stxAddress);
        setStxAddress(stxAddress || null);
        if (stxAddress) {
          await updateTransactions([]);
        }
      }}
    >
      Connect Wallet
    </Button >
  );
}

export default SignIn;
