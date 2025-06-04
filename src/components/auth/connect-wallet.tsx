import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import SignIn from "../auth/sign-in";

function ConnectWallet() {
  return (
    <Stack gap={8}>
      <Heading>Wallet Connection Required</Heading>
      <Text>
        A{" "}
        <Link href="https://leather.io" target="_blank" rel="noopener noreferrer">
          Leather
        </Link>{" "}
        or{" "}
        <Link href="https://xverse.app" target="_blank" rel="noopener noreferrer">
          Xverse
        </Link>{" "}
        wallet connection is required to use this website.
      </Text>
      <SignIn />
    </Stack>
  );
}

export default ConnectWallet;
