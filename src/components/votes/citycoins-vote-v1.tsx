import {
  Box,
  Divider,
  Link,
  Separator,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import VoteProgressBar from "./vote-progress-bar";

function CityCoinsVoteV1() {
  const yesVotes = 135;
  const noVotes = 1;
  const yesTotal = 1500875294000000;
  const noTotal = 5204049000000;

  return (
    <Stack gap={4}>
      <Box
        textAlign={["left", "center"]}
        bg={useColorModeValue("gray.200", "gray.900")}
        p={4}
      >
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
          <Stat.Root>
            <StatLabel>MIA Cycles</StatLabel>
            <StatNumber>12, 13</StatNumber>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>6, 7</StatNumber>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>{yesVotes}</StatNumber>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>{noVotes}</StatNumber>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBar yesTotal={yesTotal} noTotal={noTotal} />
      <Separator />
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
      <Stack gap={2}>
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
