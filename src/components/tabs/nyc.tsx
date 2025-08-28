import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ComingSoon from "../coming-soon";
import SignIn from "../auth/sign-in";

function Nyc() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>NYC Utilities</Heading>
        <Text>Wallet connection required to access NYC utilities.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>NYC Utilities</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default Nyc;
