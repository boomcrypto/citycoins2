import {
  Box,
  Link,
  Separator,
  Stack,
  Stat,
  Text
} from "@chakra-ui/react";
import { useCcipProposalVoteData } from "../../hooks/use-ccip-proposal-vote-data";
import { Ccip016VoteTotals } from "../../store/ccip-016";
import { CCIP_026_CONFIG } from "../../store/ccip-proposal";
import VoteButtons from './vote-buttons';
import VoteProgressBarV2 from "./vote-progress-bar-v2";
import VoteResult from "./vote-result";

function Ccip026() {
  const voterInfo = useCcipProposalVoteData(CCIP_026_CONFIG, "voterInfo");
  const isVoteActive = useCcipProposalVoteData(CCIP_026_CONFIG, "isVoteActive");
  const voteTotals = useCcipProposalVoteData(CCIP_026_CONFIG, "voteTotals");
  const hasVoted = useCcipProposalVoteData(CCIP_026_CONFIG, "hasVoted");

  // These values would be updated with actual vote data once available
  const yesVotes = voteTotals.data ? voteTotals.data.totals.totalVotesYes : 0;
  const noVotes = voteTotals.data ? voteTotals.data.totals.totalVotesNo : 0;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = voteTotals.data ? voteTotals.data.totals.totalAmountYes : 0;
  const noTotal = voteTotals.data ? voteTotals.data.totals.totalAmountNo : 0;

  const voteTotalsObject: Ccip016VoteTotals = {
    mia: {
      totalAmountYes: yesTotal,
      totalAmountNo: noTotal,
      totalVotesYes: yesVotes,
      totalVotesNo: noVotes,
    },
    nyc: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    totals: {
      totalAmountYes: yesTotal,
      totalAmountNo: noTotal,
      totalVotesYes: yesVotes,
      totalVotesNo: noVotes,
    },
  };

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
            <Stat.ValueText title={`MIA ${yesVotes}`}>{yesVotes}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={`MIA ${noVotes}`}>{noVotes}</Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-026/ccip-026-miamicoin-burn-to-exit.md"
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
          <Stack gap={1}>
            <Link
              href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip026-miamicoin-burn-to-exit?chain=mainnet"
              rel="noopener noreferrer"
              target="_blank"
            >
              ccip026-miamicoin-burn-to-exit
            </Link>
            <Link
              href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-burn-to-exit-mia?chain=mainnet"
              rel="noopener noreferrer"
              target="_blank"
            >
              ccd013-burn-to-exit-mia
            </Link>
          </Stack>
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
          Following the MiamiCoin community signal vote (CCIP-024) and the graceful protocol shutdown (CCIP-020),
          and in absence of any official response to the community's expressed desires, this CCIP proposes
          implementing a burn-to-exit mechanism for MIA holders using the secondary treasury. This mechanism
          will provide MIA holders with an optional path to burn their tokens in exchange for STX at a fixed
          ratio of 1,700 STX for every 1,000,000 MiamiCoin (MIA), while leaving the original city treasury
          (~10.2M STX) untouched.
        </Text>
        <Text>
          The burn-to-exit mechanism will access the 851,724 STX in the secondary treasury (as of cycle 115),
          sufficient to redeem approximately 501M MIA. Token holders may choose to participate in the
          burn-to-exit or maintain their position in case of future developments regarding the main treasury.
        </Text>
        <Text fontWeight="semibold" color="orange.500">
          Note: The burn-to-exit mechanism is one-way and irreversible. Once MIA tokens are burned,
          they cannot be recovered.
        </Text>
      </Stack>
      {isVoteActive.data && hasVoted ? (
        <>
          <Separator />
          <Text fontWeight="bold">Vote recorded, thank you!</Text>
          <Text>Refresh to see stats once the tx confirms.</Text>
        </>
      ) : (
        <VoteButtons />
      )}
      {hasVoted && voterInfo.data &&
        <VoteResult />
      }
    </Stack >
  );
}

export default Ccip026;
