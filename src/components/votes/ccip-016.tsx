import {
  Box,
  Button,
  Link,
  List,
  Separator,
  Stack,
  Stat,
  StatLabel,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useCcip016VoteActions } from "../../hooks/use-ccip-016-vote-actions";
import { useCcip016VoteData } from "../../hooks/use-ccip-016-vote-data";
import { Ccip016VoteTotals, CONTRACT_FQ_NAME, CONTRACT_NAME, hasVotedAtom } from "../../store/ccip-016";
import { formatMicroAmount } from "../../store/common";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import VoteProgressBarV2 from "./vote-progress-bar-v2";

function VoteButtons() {
  const { voteYes, voteNo } = useCcip016VoteActions();
  const hasVoted = useAtomValue(hasVotedAtom);
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return <SignIn />;
  }

  return (
    <>
      <Text fontWeight="bold">{hasVoted ? "Change vote" : "Voting"}:</Text>
      <Stack direction={["column", "row"]} gap={4}>
        <Button
          onClick={voteYes}
          colorPalette="green"
          size="lg"
        >
          Vote Yes
        </Button>
        <Button
          onClick={voteNo}
          colorPalette="red"
          size="lg"
        >
          Vote No
        </Button>
      </Stack>
    </>
  );
}

function VoteResult() {
  const voterInfo = useCcip016VoteData("voterInfo");

  return (
    <Stack gap={4}>
      <Text fontWeight="bold">Your Vote:</Text>
      <List.Root>
        <List.Item>
          Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
        </List.Item>
        <List.Root>
          <List.Item>MIA: {formatMicroAmount(voterInfo.data?.mia)}</List.Item>
          <List.Item>NYC: {formatMicroAmount(voterInfo.data?.nyc)}</List.Item>
        </List.Root>
      </List.Root>
    </Stack>
  );
}

function Ccip016() {
  const voterInfo = useCcip016VoteData("voterInfo");




  const isVoteActive = useCcip016VoteData("isVoteActive");
  const voteTotals = useCcip016VoteData("voteTotals");
  const hasVoted = useAtomValue(hasVotedAtom);


  const yesVoteAmountMia = voteTotals.data?.mia.totalAmountYes || 0;
  const yesVoteAmountNyc = voteTotals.data?.nyc.totalAmountYes || 0;
  const yesVoteAmountTotal = yesVoteAmountMia + yesVoteAmountNyc;

  const noVoteAmountMia = voteTotals.data?.mia.totalAmountNo || 0;
  const noVoteAmountNyc = voteTotals.data?.nyc.totalAmountNo || 0;
  const noVoteAmountTotal = noVoteAmountMia + noVoteAmountNyc;

  const yesVotesMia = voteTotals.data?.mia.totalVotesYes || 0;
  const yesVotesNyc = voteTotals.data?.nyc.totalVotesYes || 0;
  const yesVotesTotal = yesVotesMia + yesVotesNyc;
  const noVotesMia = voteTotals.data?.mia.totalVotesNo || 0;
  const noVotesNyc = voteTotals.data?.nyc.totalVotesNo || 0;
  const noVotesTotal = noVotesMia + noVotesNyc;

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
            <StatLabel>MIA Cycles</StatLabel>
            <Stat.ValueText>82, 83</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>NYC Cycles</StatLabel>
            <Stat.ValueText>82, 83</Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <StatLabel>Yes Vote Count</StatLabel>
            <Stat.ValueText title={`MIA ${yesVotesMia} / NYC ${yesVotesNyc}`}>
              {yesVotesTotal}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>No Vote Count</StatLabel>
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
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-016/ccip-016-refund-incorrect-ccd007-payouts.md"
            target="_blank" rel="noopener noreferrer"
          >
            CCIP-016
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href={`https://explorer.hiro.so/txid/${CONTRACT_FQ_NAME}?chain=mainnet`}
            target="_blank" rel="noopener noreferrer"
          >
            {CONTRACT_NAME}
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          target="_blank" rel="noopener noreferrer"
        >
          CCIP-015
        </Link>
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          The stacking contract ccd007-citycoin-stacking has a bug that sometimes incorrectly returns 0 STX rewards for a cycle.
          The the propsal sends stacking rewards to those stackers that were affected by this bug.
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
      )
      }

      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default Ccip016;
