import {
  Box,
  Link,
  Separator,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import VoteProgressBarV2 from "./vote-progress-bar-v2";
import { Ccip016VoteTotals } from "../../store/ccip-016";

function Ccip024() {
  const yesVotes = 71;
  const noVotes = 0;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 2021212615000000;
  const noTotal = 0;

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
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-024/ccips/ccip-024/ccip-024-mia-pox-4-stacking.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-024
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip024-miamicoin-signal-vote?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip024-miamicoin-signal-vote
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
          Following the execution of{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-020 Graceful Protocol Shutdown
          </Link>{" "}
          and{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-022 CityCoins Treasury Redemption NYC
          </Link>
          , the MiamiCoin (MIA) community seeks to send a verifiable poll to the
          City of Miami regarding the STX treasury held by the protocol. This
          CCIP proposes an on-chain vote for MIA holders to express their desire
          for the City of Miami to consider nullifying their gift agreement and
          allow token holders to liquidate the treasury in a manner similar to
          the NYC redemption process outlined in CCIP-022.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip024;
