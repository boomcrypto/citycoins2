import { Heading, Stack, Text } from "@chakra-ui/react";
import { miningBlocksToClaimPerCityAtom } from "../../store/citycoins";
import { useAtomValue } from "jotai";

function MiningClaims() {
  const miningBlocksToClaim = useAtomValue(miningBlocksToClaimPerCityAtom);
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Mining Claims</Heading>
      <Text>{JSON.stringify(miningBlocksToClaim)}</Text>
    </Stack>
  );
}

export default MiningClaims;
