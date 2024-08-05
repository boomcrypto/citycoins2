import {
  Box,
  Button,
  Code,
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
import { useCcip019VoteData } from "../../hooks/use-ccip-019-vote-data";
import { useCcip019VoteActions } from "../../hooks/use-ccip-019-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { hasVotedAtom } from "../../store/ccip-019";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import VoteProgressBarCCIP022 from "./vote-progress-bar-ccip022";
import { Ccip022VoteTotals } from "../../store/ccip-022";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip019VoteActions();
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
  const voterInfo = useCcip019VoteData("voterInfo");

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

function CCIP019() {
  const voterInfo = useCcip019VoteData("voterInfo");

  const isVoteActive = useCcip019VoteData("isVoteActive");
  const voteTotals = useCcip019VoteData("voteTotals");
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
        <VoteProgressBarCCIP022 props={voteTotals.data as Ccip022VoteTotals} />
      )}
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-019/ccips/ccip-019/ccip-019-mia-pox-4-stacking.md"
            isExternal
          >
            CCIP-019
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://github.com/friedger/cc-protocol/blob/ccip-019/contracts/proposals/ccip019-pox-4-stacking.clar"
            isExternal
          >
            ccip019-pox-4-stacking
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
          When the{" "}
          <Link href="" isExternal>
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
            isExternal
          >
            CCIP-020
          </Link>{" "}
          disabled mining and stacking of CityCoin tokens, and{" "}
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
            isExternal
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

export default CCIP019;
