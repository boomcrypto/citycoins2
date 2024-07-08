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
import { Ccip022VoteTotals, hasVotedAtom } from "../../store/ccip-022";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import VoteProgressBarCCIP022 from "./vote-progress-bar-ccip022";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip022VoteActions();
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
            <StatLabel>NYC Cycles</StatLabel>
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
            <StatNumber title={`NYC ${voteTotals.data?.nyc.totalVotesYes}`}>
              {voteTotals.data?.totals.totalVotesYes ?? <Spinner />}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`NYC ${voteTotals.data?.nyc.totalVotesNo}`}>
              {voteTotals.data?.totals.totalVotesNo ?? <Spinner />}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      {voteTotals.data && (
        <VoteProgressBarCCIP022 props={voteTotals.data as Ccip022VoteTotals} />
      )}
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            isExternal
          >
            CCIP-022
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://github.com/citycoins/protocol/blob/main/contracts/proposals/ccip022-treasury-redemption-nyc.clar"
            isExternal
          >
            ccip022-treasury-redemption-nyc
          </Link>
          <br />
          <Link
            href="https://github.com/citycoins/protocol/blob/main/contracts/extensions/ccd012-redemption-nyc.clar"
            isExternal
          >
            ccd012-redemption-nyc
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
          With the execution of{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            isExternal
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
            isExternal
          >
            (ccd012-redemption-nyc)
          </Link>{" "}
          that will hold the treasury balance, calculate the redemption ratio
          based on the total supply, and track claims for users based on the
          balance of NYC in their wallet. Both V1 and V2 are supported.
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

export default CCIP022;
