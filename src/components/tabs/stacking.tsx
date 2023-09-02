import { Heading, Stack } from "@chakra-ui/react";
import ComingSoon from "../coming-soon";

function Stacking() {
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Stacking</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default Stacking;
