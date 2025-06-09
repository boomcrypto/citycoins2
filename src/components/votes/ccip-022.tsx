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

function Ccip022() {
  const yesVotes = 132;
  const noVotes = 4;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 1404542830929124;
  const noTotal = 1250562992000000;

  const voteTotalsObject: Ccip016VoteTotals = {
    mia: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    nyc: {
      totalAmountYes: yesTotal,
      totalAmountNo: noTotal,
      totalVotesYes: yesVotes,
      totalVotesNo: noVotes,
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
            <Stat.Label>NYC Cycles</Stat.Label>
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
            <Stat.ValueText title={`NYC ${yesVotes}`}>{yesVotes}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={`NYC ${noVotes}`}>{noVotes}</Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-022
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip022-treasury-redemption-nyc?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip022-treasury-redemption-nyc
          </Link>
          <br />
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccd012-redemption-nyc
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
          With the execution of{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-020 Graceful Protocol Shutdown
          </Link>{" "}
          (Vote 7) the functions for mining and stacking CityCoins are disabled.
          Following that change this CCIP proposes a redemption mechanism for
          NYC token holders to be fairly compensated by redeeming their
          CityCoins for a portion of the STX held in the city treasury.
        </Text>
        <Text>
          A new redemption extension will be created{" "}
          <Link
            href="https://github.com/citycoins/protocol/blob/main/contracts/extensions/ccd012-redemption-nyc.clar"
            rel="noopener noreferrer"
            target="_blank"
          >
            (ccd012-redemption-nyc)
          </Link>{" "}
          that will hold the treasury balance, calculate the redemption ratio
          based on the total supply, and track claims for users based on the
          balance of NYC in their wallet. Both V1 and V2 are supported.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip022;
