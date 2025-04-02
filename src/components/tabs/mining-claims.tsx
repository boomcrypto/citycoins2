import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import { MiningStatus } from "../mining-status";

function MiningClaims() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack spacing={4}>
        <Heading>CityCoins Mining Claims</Heading>
        <Text>Wallet connection required to access mining claims.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Heading>CityCoins Mining Claims</Heading>
      <Text>View your mining activity and claim available rewards below.</Text>
      <MiningStatus />
    </Stack>
  );
}

export default MiningClaims;
