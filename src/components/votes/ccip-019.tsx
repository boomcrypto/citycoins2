import {
  Box,
  Code,
  Link,
  Separator,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import VoteProgressBarV2 from "./vote-progress-bar-v2";
import { Ccip016VoteTotals } from "../../store/ccip-016";

function Ccip019() {
  const yesVotes = 56;
  const noVotes = 0;
  const yesTotal = 1933337130000000;
  const noTotal = 0;
  const totalVoteCount = yesVotes + noVotes;

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
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-019/ccips/ccip-019/ccip-019-mia-pox-4-stacking.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-019
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip019-pox-4-stacking?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip019-pox-4-stacking
          </Link>
          ,{" "}
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-mining-v3?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccd002-treasury-mia-mining-v3
          </Link>
          ,{" "}
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-rewards-v3?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccd002-treasury-mia-rewards-v3
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
          When the{" "}
          <Link href="" rel="noopener noreferrer" target="_blank">
            Stacks Nakamoto release
          </Link>{" "}
          was implemented, a new version of the PoX contract <Code>.pox-4</Code>{" "}
          was deployed and activated. The previous versions of the PoX contract
          were used by the treasury contracts to perform delegated stacking of
          STX. At the time of the release all STX tokens were unlocked from the
          old PoX contract, and both CityCoin treasuries stopped their use of
          delegated stacking.
        </Text>
        <Text>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-020
          </Link>{" "}
          disabled mining and stacking of CityCoin tokens, and{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-022
          </Link>{" "}
          started the liquidation of the NYC mining treasury. However, the
          future of the MIA treasury has not been finalized. Until then, this
          CCIP will stack the MIA mining treasury using pox-4 to earn stacking
          rewards.
        </Text>
        <Text>
          The stacking rewards will be collected in a separate treasury and used
          for future redemption or other purposes.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip019;
