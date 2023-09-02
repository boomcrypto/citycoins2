import {
  Box,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";

function CityCoinsVoteV1() {
  return (
    <Stack spacing={4}>
      <Box textAlign={["left", "center"]} bg="gray.900" p={4}>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>MIA Cycles</StatLabel>
            <StatNumber>12, 13</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>6, 7</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>135</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>1</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Total</StatLabel>
            <StatNumber>1,500,875,294</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Total</StatLabel>
            <StatNumber>5,204,049</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link href="#your-link-for-CCIP-008" isExternal>
            CCIP-008
          </Link>
          ,
          <Link href="#your-link-for-CCIP-009" ml={2} isExternal>
            CCIP-009
          </Link>
          ,
          <Link href="#your-link-for-CCIP-010" ml={2} isExternal>
            CCIP-010
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link href="#your-link-for-contract" isExternal>
          citycoins-vote-v1
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link href="#your-link-for-CCIP-011" isExternal>
          CCIP-011
        </Link>
      </Stack>
      <Box>
        <Text fontWeight="bold" mb={2}>
          Details:
        </Text>
        <Text mb={2}>
          The CityCoins community is proposing an update to the emissions
          schedule for current and future CityCoins. The update will
          adjust/compress the emissions schedule with "halvings" based on a
          doubling epoch model with an initial bonus period, in which the length
          of each epoch is twice as long as the last following epoch 1. For more
          details, see{" "}
          <Link href="#your-link-for-CCIP-008" isExternal>
            CCIP-008
          </Link>
          .
        </Text>
        <Text>
          This also presents the opportunity to add some minor features to the
          CityCoins protocol, including token divisibility, an upgraded VRF
          contract with performance improvements and modification to the auth
          contract to allow for more flexibility in the future. For more
          details, see{" "}
          <Link href="#your-link-for-CCIP-009" isExternal>
            CCIP-009
          </Link>{" "}
          and{" "}
          <Link href="#your-link-for-CCIP-010" isExternal>
            CCIP-010
          </Link>
          .
        </Text>
      </Box>
    </Stack>
  );
}

export default CityCoinsVoteV1;
