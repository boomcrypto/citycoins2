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

function Ccip025() {
  const yesVotes = 20;
  const noVotes = 0;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 1387676994000000;
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
            <Stat.ValueText title={totalVoteCount.toString()}>{totalVoteCount}</Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <Stat.Label>Yes Vote Count</Stat.Label>
            <Stat.ValueText title={yesVotes.toString()}>
              {yesVotes}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={noVotes.toString()}>
              {noVotes}
            </Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-025/ccips/ccip-025/ccip-025-extend-direct-execute-sunset-period-3.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-025
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip025-extend-sunset-period-3?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip025-extend-sunset-period-3
          </Link>
          <br />
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip025-extend-sunset-period-3-v2?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip025-extend-sunset-period-3-v2
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
          When the ccd001-direct-execute1 Clarity contract was deployed, a
          sunset height of approximately 6 months was set, after which the
          extension will no longer be able to execute proposals. This
          functionality was extended as part of CCIP-017 and CCIP-021.
        </Text>
        <Text>
          The current sunset height is 173,748. After that block height no
          proposal can be executed anymore. In preparation of CCIP-016 and
          CCIP-023, an extension is required now. This CCIP intends to extend
          the sunset period by an additional 103,680 Stacks blocks (approx 2
          years)
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip025;
