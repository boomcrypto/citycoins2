import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ComingSoon from "../coming-soon";
import SignIn from "../auth/sign-in";

function Mia() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>MIA Utilities</Heading>
        <Text>Wallet connection required to access MIA utilities.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>MIA Utilities</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default Mia;
