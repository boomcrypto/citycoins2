import {
  Box,
  Divider,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import VoteProgressBar from "./vote-progress-bar";

function CityCoinsVoteV3() {
  const yesVotes = 58;
  const noVotes = 8;
  const yesTotal = 2275972984000000;
  const noTotal = 144037303000000;

  return (
    <Stack spacing={4}>
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
          <Stat>
            <StatLabel>MIA Cycles</StatLabel>
            <StatNumber>24, 25</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>18, 19</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>{yesVotes}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>{noVotes}</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBar yesTotal={yesTotal} noTotal={noTotal} />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-013/ccip-013-stabilize-protocol-and-simplify-contracts.md"
            isExternal
          >
            CCIP-013
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP5X6BFPYXTZ8C63EYYPA02X2VQTG4V43XNPGAPF.citycoins-vote-v3?chain=mainnet"
          isExternal
        >
          citycoins-vote-v3
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
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-013/ccip-013-stabilize-protocol-and-simplify-contracts.md"
            isExternal
          >
            CCIP-013
          </Link>{" "}
          is the second of two proposals, including simplifying the CityCoin
          contract structure under control of the newly formed DAO, and updating
          the mining and stacking value flows.
        </Text>
      </Stack>
    </Stack>
  );
}

export default CityCoinsVoteV3;
