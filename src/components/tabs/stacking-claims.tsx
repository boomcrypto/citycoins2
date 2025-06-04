import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ComingSoon from "../coming-soon";
import SignIn from "../auth/sign-in";

function StackingClaims() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>CityCoins Mining Claims</Heading>
        <Text>Wallet connection required to access stacking claims.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>CityCoins Stacking Claims</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default StackingClaims;
