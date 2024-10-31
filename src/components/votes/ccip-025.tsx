import {
  Box,
  Button,
  Divider,
  Link,
  ListItem,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  UnorderedList,
  useColorModeValue,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useCcip025VoteData } from "../../hooks/use-ccip-025-vote-data";
import { useCcip025VoteActions } from "../../hooks/use-ccip-025-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { Ccip025VoteTotals, hasVotedAtom } from "../../store/ccip-025";
import { stxAddressAtom } from "../../store/stacks";
import VoteProgressBarMiaOnly from "./vote-progress-bar-mia-only";
import SignIn from "../sign-in";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip025VoteActions();
  const hasVoted = useAtomValue(hasVotedAtom);
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return <SignIn />;
  }

  return (
    <>
      <Text fontWeight="bold">{hasVoted ? "Change vote" : "Voting"}:</Text>
      <Stack direction={["column", "row"]} spacing={4}>
        <Button
          onClick={voteYes}
          colorScheme="green"
          size="lg"
          isLoading={isRequestPending}
        >
          Vote Yes
        </Button>
        <Button
          onClick={voteNo}
          colorScheme="red"
          size="lg"
          isLoading={isRequestPending}
        >
          Vote No
        </Button>
      </Stack>
    </>
  );
}

function VoteResult() {
  const voterInfo = useCcip025VoteData("voterInfo");

  return (
    <Stack spacing={4}>
      <Text fontWeight="bold">Your Vote:</Text>
      <UnorderedList>
        <ListItem>
          Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
        </ListItem>
        <ListItem>
          Total Votes: {formatMicroAmount(voterInfo.data?.mia)} CityCoins
        </ListItem>
        <UnorderedList>
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP025() {
  const isVoteActive = useCcip025VoteData("isVoteActive");
  const voteTotals = useCcip025VoteData("voteTotals");
  const voterInfo = useCcip025VoteData("voterInfo");
  const hasVoted = useAtomValue(hasVotedAtom);

  const totalVotes =
    parseInt(voteTotals.data?.totals.totalVotesNo) +
    parseInt(voteTotals.data?.totals.totalVotesYes);

  const voteTotalsObject: Ccip025VoteTotals = voteTotals.data || {
    mia: {
      totalAmountYes: "0",
      totalAmountNo: "0",
      totalVotesYes: "0",
      totalVotesNo: "0",
    },
    totals: {
      totalAmountYes: "0",
      totalAmountNo: "0",
      totalVotesYes: "0",
      totalVotesNo: "0",
    },
  };

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
            <StatNumber>82, 83</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber title={totalVotes.toString()}>
              {totalVotes}
            </StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber title={voteTotalsObject.totals.totalVotesYes}>
              {voteTotalsObject.totals.totalVotesYes}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={voteTotalsObject.totals.totalVotesNo}>
              {voteTotalsObject.totals.totalVotesNo}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBarMiaOnly props={voteTotalsObject} />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-025/ccips/ccip-025/ccip-025-extend-direct-execute-sunset-period-3.md"
            isExternal
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
            isExternal
          >
            ccip025-extend-sunset-period-3
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
      <Stack spacing={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          This proposal extends the sunset period for direct execution of proposals by an additional 2 years. The current sunset period is set to expire in Q4 2023, and this extension would allow the community to continue using the direct execution process through Q4 2025.
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
      )}

      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP025;
