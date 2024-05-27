import {
  Box,
  Button,
  Divider,
  Link,
  ListItem,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  UnorderedList,
  useColorModeValue,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useCcip022VoteData } from "../../hooks/use-ccip-022-vote-data";
import { useCcip022VoteActions } from "../../hooks/use-ccip-022-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { hasVotedAtom } from "../../store/ccip-022";
import { Ccip020VoteTotals } from "../../store/ccip-020";
import VoteProgressBarV2 from "./vote-progress-bar-v2";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip022VoteActions();
  const hasVoted = useAtomValue(hasVotedAtom);

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
  const voterInfo = useCcip022VoteData("voterInfo");

  return (
    <Stack spacing={4}>
      <Text fontWeight="bold">Your Vote:</Text>
      <UnorderedList>
        <ListItem>
          Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
        </ListItem>
        <ListItem>
          Total Votes: {formatMicroAmount(voterInfo.data?.total)} CityCoins
        </ListItem>
        <UnorderedList>
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
          <ListItem>NYC: {formatMicroAmount(voterInfo.data?.nyc)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP022() {
  const voterInfo = useCcip022VoteData("voterInfo");
  const isVoteActive = useCcip022VoteData("isVoteActive");
  const voteTotals = useCcip022VoteData("voteTotals");
  const hasVoted = useAtomValue(hasVotedAtom);

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
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>82, 83</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber
              title={`MIA ${voteTotals.data?.mia.totalVotesYes} / NYC ${voteTotals.data?.nyc.totalVotesYes}`}
            >
              {voteTotals.data?.totals.totalVotesYes ?? <Spinner />}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber
              title={`MIA ${voteTotals.data?.mia.totalVotesNo} / NYC ${voteTotals.data?.nyc.totalVotesNo}`}
            >
              {voteTotals.data?.totals.totalVotesNo ?? <Spinner />}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      {voteTotals.data && (
        <VoteProgressBarV2 props={voteTotals.data as Ccip020VoteTotals} />
      )}
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link href="" isExternal>
            CCIP-022
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link href="" isExternal>
          ccip-022-treasury-redemption-nyc
        </Link>
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
        <Text>TBD</Text>
        <Text>TBD</Text>
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

export default CCIP022;
