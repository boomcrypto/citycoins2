import {
  Box,
  Link,
  Separator,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import VoteProgressBarV2 from "./vote-progress-bar-v2";
import { Ccip026VoteTotals } from "../../store/ccip-026";
import { useCcip026VoteData } from "../../hooks/use-ccip-026-vote-data";

// TODO: Replace with dynamic data from useCcip026VoteData once vote is active
// For now, placeholder with 0s; update to hardcoded results post-vote
function Ccip026() {
  const voteTotals = useCcip026VoteData("voteTotals");

  let voteTotalsObject: Ccip026VoteTotals = {
    mia: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    nyc: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    totals: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
  };

  if (voteTotals.hasData && voteTotals.data) {
    voteTotalsObject = voteTotals.data as Ccip026VoteTotals;
  }

  const yesVotesMia = voteTotalsObject.mia.totalVotesYes;
  const noVotesMia = voteTotalsObject.mia.totalVotesNo;
  const totalVoteCount = yesVotesMia + noVotesMia;

  return (
    <Stack gap={4}>
      <Box
        textAlign={["left", "center"]}
        p={4}
      >
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
          <Stat.Root>
            <Stat.Label>MIA Cycles</Stat.Label>
            <Stat.ValueText>82, 83</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>Total Votes</Stat.Label>
            <Stat.ValueText title={totalVoteCount.toString()}>
              {totalVoteCount}
            </Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <Stat.Label>Yes Vote Count</Stat.Label>
            <Stat.ValueText title={`MIA ${yesVotesMia}`}>{yesVotesMia}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={`MIA ${noVotesMia}`}>{noVotesMia}</Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/eea941ea40c16428b4806d1808e7dab9fc095e0a/ccips/ccip-026/ccip-026-miamicoin-burn-to-exit.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-026
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip026-miamicoin-burn-to-exit?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip026-miamicoin-burn-to-exit
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          rel="noopener noreferrer"
          target="_blank"
        >
          CCIP-015
        </Link>
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          Following the MiamiCoin community signal vote and the graceful protocol shutdown, and in absence of any official response to the community's expressed desires, this CCIP proposes implementing a burn-to-exit mechanism for MIA holders using the secondary treasury. This mechanism will provide MIA holders with an optional path to burn their tokens in exchange for STX at a fixed ratio, while leaving the original city treasury untouched.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip026;
