import { Link, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import SignIn from "../auth/sign-in";

function ConnectWallet() {
  return (
    <Stack gap={8}>
      <Text>Wallet Connection Required</Text>
      <SignIn />
    </Stack>
  );
}

export default ConnectWallet;
