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

function CityCoinsVoteV2() {
  const yesVotes = 73;
  const noVotes = 11;
  const yesTotal = 1530382681000000;
  const noTotal = 242180281000000;

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
            <StatNumber>21, 22</StatNumber>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>15, 16</StatNumber>
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
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-012/ccip-012-stabilize-emissions-and-treasuries.md"
            isExternal
          >
            CCIP-012
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP119FQPVQ39AKVMC0CN3Q1ZN3ZMCGMBR52ZS5K6E.citycoins-vote-v2?chain=mainnet"
          isExternal
        >
          citycoins-vote-v2
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
          Over the summer, CityCoiners have been working on a plan to stabilize
          the protocol and optimize for future development, experimentation, and
          growth.
        </Text>
        <Text>
          Community discussions and feedback have resulted in a four-phase
          proposal designed to stabilize the protocol. The phases have been
          split into two separate CityCoins Improvement Proposals (CCIPs).
        </Text>
        <Text>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-012/ccip-012-stabilize-emissions-and-treasuries.md"
            isExternal
          >
            CCIP-012
          </Link>{" "}
          is the first of two proposals that will be voted on by the community.
          The proposal included a 2% emissions model and moving treasuries to
          smart contract vaults, and is now implemented.
        </Text>
      </Stack>
    </Stack>
  );
}

export default CityCoinsVoteV2;
