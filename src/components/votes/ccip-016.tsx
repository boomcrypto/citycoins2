import {
  Box,
  Button,
  Link,
  List,
  ListItem,
  Stack,
  Stat,
  StatLabel,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useCcip016VoteActions } from "../../hooks/use-ccip-016-vote-actions";
import { useCcip016VoteData } from "../../hooks/use-ccip-016-vote-data";
import { Ccip016VoteTotals, hasVotedAtom } from "../../store/ccip-016";
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
          colorScheme="green"
          size="lg"
        >
          Vote Yes
        </Button>
        <Button
          onClick={voteNo}
          colorScheme="red"
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
        <ListItem>
          Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
        </ListItem>
        <List.Root>
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
          <ListItem>NYC: {formatMicroAmount(voterInfo.data?.nyc)}</ListItem>
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
        bg={useColorModeValue("gray.200", "gray.900")}
        p={4}
      >
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
          <Stat.Root>
            <StatLabel>MIA Cycles</StatLabel>
            <StatNumber>82, 83</StatNumber>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>82, 83</StatNumber>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber title={`MIA ${yesVotesMia} / NYC ${yesVotesNyc}`}>
              {yesVotesTotal}
            </StatNumber>
          </Stat.Root>
          <Stat.Root>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`MIA ${noVotesMia} / NYC ${noVotesNyc}`}>
              {noVotesTotal}
            </StatNumber>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-025/ccips/ccip-025/ccip-025-extend-direct-execute-sunset-period-3.md"
            isExternal
          >
            CCIP-016
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ccip016-missed-payouts?chain=mainnet"
            isExternal
          >
            ccip016-extend-sunset-period-3
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          isExternal
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
          <Divider />
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
