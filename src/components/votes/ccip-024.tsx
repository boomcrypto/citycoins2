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
import { useCcip024VoteData } from "../../hooks/use-ccip-024-vote-data";
import { useCcip024VoteActions } from "../../hooks/use-ccip-024-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { Ccip024VoteTotals, hasVotedAtom } from "../../store/ccip-024";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import VoteProgressBarMiaOnly from "./vote-progress-bar-mia-only";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip024VoteActions();
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
  const voterInfo = useCcip024VoteData("voterInfo");

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
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.nyc)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP024() {
  const voterInfo = useCcip024VoteData("voterInfo");

  const isVoteActive = useCcip024VoteData("isVoteActive");
  const voteTotals = useCcip024VoteData("voteTotals");
  const hasVoted = useAtomValue(hasVotedAtom);
  const totalVotes =
    parseInt(voteTotals.data?.totals.totalVotesNo) +
    parseInt(voteTotals.data?.totals.totalVotesYes);

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
              {totalVotes ?? <Spinner />}
            </StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber title={`MIA ${voteTotals.data?.nyc.totalVotesYes}`}>
              {voteTotals.data?.totals.totalVotesYes ?? <Spinner />}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`MIA ${voteTotals.data?.nyc.totalVotesNo}`}>
              {voteTotals.data?.totals.totalVotesNo ?? <Spinner />}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      {voteTotals.data && (
        <VoteProgressBarMiaOnly props={voteTotals.data as Ccip024VoteTotals} />
      )}
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-024/ccips/ccip-024/ccip-024-mia-pox-4-stacking.md"
            isExternal
          >
            CCIP-024
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://github.com/friedger/cc-protocol/blob/ccip-024/contracts/proposals/ccip024-pox-4-stacking.clar"
            isExternal
          >
            ccip024-pox-4-stacking
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
          Following the execution of{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            isExternal
          >
            CCIP-020 Graceful Protocol Shutdown
          </Link>{" "}
          and{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            isExternal
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

export default CCIP024;
