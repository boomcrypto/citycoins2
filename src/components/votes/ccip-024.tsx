import {
  Box,
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
import { useCcip024VoteData } from "../../hooks/use-ccip-024-vote-data";
import { formatMicroAmount } from "../../store/common";
import { Ccip024VoteTotals } from "../../store/ccip-024";
import VoteProgressBarMiaOnly from "./vote-progress-bar-mia-only";

/*
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
*/

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
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP024() {
  const voterInfo = useCcip024VoteData("voterInfo");

  /*
  const isVoteActive = useCcip024VoteData("isVoteActive");
  const voteTotals = useCcip024VoteData("voteTotals");
  const hasVoted = useAtomValue(hasVotedAtom);
  const totalVotes =
    parseInt(voteTotals.data?.totals.totalVotesNo) +
    parseInt(voteTotals.data?.totals.totalVotesYes);
  */

  const yesVotes = 71;
  const noVotes = 0;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 2021212615000000;
  const noTotal = 0;

  const voteTotalsObject: Ccip024VoteTotals = {
    mia: {
      totalAmountYes: yesTotal.toString(),
      totalAmountNo: noTotal.toString(),
      totalVotesYes: yesVotes.toString(),
      totalVotesNo: noVotes.toString(),
    },
    totals: {
      totalAmountYes: yesTotal.toString(),
      totalAmountNo: noTotal.toString(),
      totalVotesYes: yesVotes.toString(),
      totalVotesNo: noVotes.toString(),
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
            <StatNumber title={totalVoteCount.toString()}>
              {totalVoteCount}
            </StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber title={`MIA ${yesVotes}`}>{yesVotes}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`MIA ${noVotes}`}>{noVotes}</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBarMiaOnly props={voteTotalsObject} />
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
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip024-miamicoin-signal-vote?chain=mainnet"
            isExternal
          >
            ccip024-miamicoin-signal-vote
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

      {/*isVoteActive.data && hasVoted ? (
        <>
          <Divider />
          <Text fontWeight="bold">Vote recorded, thank you!</Text>
          <Text>Refresh to see stats once the tx confirms.</Text>
        </>
      ) : (
        <VoteButtons />
      )*/}

      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP024;
