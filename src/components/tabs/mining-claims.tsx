import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ComingSoon from "../coming-soon";
import SignIn from "../auth/sign-in";

function MiningClaims() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>CityCoins Mining Claims</Heading>
        <Text>Wallet connection required to access mining claims.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>CityCoins Mining Claims</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default MiningClaims;
