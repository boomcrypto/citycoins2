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
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-008/ccip-008-citycoins-sip-010-token-v2.md"
            isExternal
          >
            CCIP-008
          </Link>
          ,
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-009/ccip-009-citycoins-vrf-v2.md"
            ml={2}
            isExternal
          >
            CCIP-009
          </Link>
          ,
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-010/ccip-010-citycoins-auth-v2.md"
            ml={2}
            isExternal
          >
            CCIP-010
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP34FHX44NK9KZ8KJC08WR2NHP8NEGFTTT7MTH7XD.citycoins-vote-v1?chain=mainnet"
          isExternal
        >
          citycoins-vote-v1
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-011/ccip-011-citycoins-stacked-tokens-voting.md"
          isExternal
        >
          CCIP-011
        </Link>
      </Stack>
      <Stack spacing={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          The CityCoins community is proposing an update to the emissions
          schedule for current and future CityCoins. The update will
          adjust/compress the emissions schedule with "halvings" based on a
          doubling epoch model with an initial bonus period, in which the length
          of each epoch is twice as long as the last following epoch 1. For more
          details, see{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-008/ccip-008-citycoins-sip-010-token-v2.md"
            isExternal
          >
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
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-009/ccip-009-citycoins-vrf-v2.md"
            isExternal
          >
            CCIP-009
          </Link>{" "}
          and{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-010/ccip-010-citycoins-auth-v2.md"
            isExternal
          >
            CCIP-010
          </Link>
          .
        </Text>
      </Stack>
    </Stack>
  );
}

export default CityCoinsVoteV1;
