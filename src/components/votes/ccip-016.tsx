import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
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
import VoteProgressBar from "./vote-progress-bar";
import { useCcip016VoteData } from "../../hooks/use-ccip-016-vote-data";
import { useCcip016VoteActions } from "../../hooks/use-ccip-016-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import { hasVotedAtom as ccip016HasVotedAtom } from "../../store/ccip-016"; // aliased to avoid conflict if other hasVotedAtoms are in scope
import SignIn from "../auth/sign-in";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip016VoteActions();
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return <SignIn />;
  }

  return (
    <>
      <Text fontWeight="bold" textAlign="center">
        Voting:
      </Text>
      <Stack direction={["column", "row"]} spacing={4} justifyContent="center">
        <Button
          onClick={voteYes}
          colorScheme="green"
          isLoading={isRequestPending}
          isDisabled={isRequestPending}
        >
          Vote Yes
        </Button>
        <Button
          onClick={voteNo}
          colorScheme="red"
          isLoading={isRequestPending}
          isDisabled={isRequestPending}
        >
          Vote No
        </Button>
      </Stack>
    </>
  );
}

function VoteResult() {
  const voterInfo = useCcip016VoteData("voterInfo");

  if (voterInfo.isLoading) return <CircularProgress isIndeterminate />;
  if (voterInfo.hasError || !voterInfo.data) {
    // console.log("Voter Info Error or No Data", voterInfo.error);
    return <Text>Could not load your voting information.</Text>;
  }

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

function CCIP016() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const voteTotals = useCcip016VoteData("voteTotals");
  const isVoteActive = useCcip016VoteData("isVoteActive");
  const voterInfo = useCcip016VoteData("voterInfo");
  const hasVoted = useAtomValue(ccip016HasVotedAtom);
  const { isRequestPending } = useCcip016VoteActions(); // voteYes and voteNo are now in VoteButtons

  const yesVotes = voteTotals.data?.yesVotes ?? 0;
  const noVotes = voteTotals.data?.noVotes ?? 0;
  const yesTotal = voteTotals.data?.yesTotal ?? 0;
  const noTotal = voteTotals.data?.noTotal ?? 0;

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
            {voteTotals.isLoading ? (
              <CircularProgress isIndeterminate size="20px" />
            ) : (
              <StatNumber>{yesVotes}</StatNumber>
            )}
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            {voteTotals.isLoading ? (
              <CircularProgress isIndeterminate size="20px" />
            ) : (
              <StatNumber>{noVotes}</StatNumber>
            )}
          </Stat>
        </Stack>
      </Box>
      {voteTotals.isLoading ? (
        <CircularProgress isIndeterminate alignSelf="center" />
      ) : (
        <VoteProgressBar yesTotal={yesTotal} noTotal={noTotal} />
      )}
      <Divider />
      {isVoteActive.isLoading ? (
        <CircularProgress isIndeterminate alignSelf="center" />
      ) : isVoteActive.data ? (
        hasVoted || voterInfo.data ? ( // If already voted (from atom) or voterInfo loaded (from contract)
          <>
            <Text fontWeight="bold" textAlign="center">
              Vote recorded, thank you!
            </Text>
            <Text textAlign="center">
              Refresh to see stats once the tx confirms.
            </Text>
          </>
        ) : (
          <VoteButtons />
        )
      ) : (
        <Text textAlign="center">Voting period is not active.</Text>
      )}
      {isRequestPending && (
        <Text textAlign="center">Please confirm in your wallet...</Text>
      )}
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-016/ccip-016-refund-incorrect-ccd007-payouts.md"
            isExternal
          >
            CCIP-016
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href={`https://explorer.hiro.so/txid/${CONTRACT_ADDRESS}.${CONTRACT_NAME}?chain=mainnet`} // TODO: Update with actual contract
          isExternal
        >
          {CONTRACT_NAME} {/* TODO: Update with actual contract */}
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
        <Text>
          CCIP-016 proposes to refund users who were affected by a bug in the
          ccd007-citycoin-stacking contract, which resulted in incorrect STX
          rewards for certain cycles. This proposal will analyze the affected
          claims and transfer the correct STX reward to each user.
        </Text>
        <Text>
          Voting for this proposal will determine whether to proceed with the
          refund process as outlined in the CCIP.
        </Text>
      </Stack>
      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

// TODO: Update with actual contract address and name for CCIP-016
const CONTRACT_ADDRESS = "SP000000000000000000002Q6VF78";
const CONTRACT_NAME = "ccip016-vote-contract";

export default CCIP016;
