import {
  Box,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";

function CityCoinsVoteV2() {
  return (
    <Stack spacing={4}>
      <Box textAlign={["left", "center"]} bg="gray.900" p={4}>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>MIA Cycles</StatLabel>
            <StatNumber>21, 22</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>15, 16</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>73</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>11</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Total</StatLabel>
            <StatNumber>1,530,382,681</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Total</StatLabel>
            <StatNumber>242,180,281</StatNumber>
          </Stat>
        </Stack>
      </Box>
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
      <Stack spacing={2}>
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
