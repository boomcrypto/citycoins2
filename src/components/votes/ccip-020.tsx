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

function Ccip020() {
  const yesVotesMia = 53;
  const yesVotesNyc = 65;
  const yesVotesTotal = yesVotesMia + yesVotesNyc;

  const yesVoteAmountMia = 1716065533000000;
  const yesVoteAmountNyc = 2282041983000000;
  const yesVoteAmountTotal = yesVoteAmountMia + yesVoteAmountNyc;

  const noVotesMia = 3;
  const noVotesNyc = 3;
  const noVotesTotal = noVotesMia + noVotesNyc;

  const noVoteAmountMia = 66417390000000;
  const noVoteAmountNyc = 9370136000000;
  const noVoteAmountTotal = noVoteAmountMia + noVoteAmountNyc;

  const voteTotalsObject: Ccip016VoteTotals = {
    mia: {
      totalAmountYes: yesVoteAmountMia,
      totalAmountNo: noVoteAmountMia,
      totalVotesYes: yesVotesMia,
      totalVotesNo: noVotesMia,
    },
    nyc: {
      totalAmountYes: yesVoteAmountNyc,
      totalAmountNo: noVoteAmountNyc,
      totalVotesYes: yesVotesNyc,
      totalVotesNo: noVotesNyc,
    },
    totals: {
      totalAmountYes: yesVoteAmountTotal,
      totalAmountNo: noVoteAmountTotal,
      totalVotesYes: yesVotesTotal,
      totalVotesNo: noVotesTotal,
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
            <Stat.ValueText>80, 81</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>NYC Cycles</Stat.Label>
            <Stat.ValueText>80, 81</Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <Stat.Label>Yes Vote Count</Stat.Label>
            <Stat.ValueText title={`MIA ${yesVotesMia} / NYC ${yesVotesNyc}`}>
              {yesVotesTotal}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={`MIA ${noVotesMia} / NYC ${noVotesNyc}`}>
              {noVotesTotal}
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
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-020/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-020
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown?chain=mainnet"
          rel="noopener noreferrer"
          target="_blank"
        >
          ccip-020-graceful-protocol-shutdown
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/feat/add-ccip-015/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          rel="noopener noreferrer"
          target="_blank"
        >
          CCIP-015
        </Link>
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          As the CityCoins Protocol prepares for the{" "}
          <Link
            href="https://docs.stacks.co/nakamoto-upgrade/nakamoto-rollout-plan"
            rel="noopener noreferrer"
            target="_blank"
          >
            upcoming Nakamoto release on the Stacks blockchain
          </Link>
          , the accumulation of technical debt with each change has made it
          increasingly challenging for core contributors and volunteers to keep
          up with the necessary updates. In light of these challenges and after
          careful consideration of community feedback, this CCIP proposes a
          graceful shutdown of the CityCoins Protocol.
        </Text>
        <Text>
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-020
          </Link>{" "}
          implements the CCIP-015 voting mechanism as part of a DAO proposal to
          disable mining and stacking in the CityCoins protocol, freezing the
          total supply and unlocking any stacked CityCoins to claim.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip020;
