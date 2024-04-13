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
import { useCcip020VoteData } from "../../hooks/use-ccip-020-vote-data";
import { useCcip020VoteActions } from "../../hooks/use-ccip-020-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { hasVotedAtom } from "../../store/ccip-020";
import VoteProgressBar from "./vote-progress-bar";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip020VoteActions();
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
  const voterInfo = useCcip020VoteData("voterInfo");

  return (
    <Stack spacing={4}>
      <Text fontWeight="bold">Your Vote:</Text>
      <UnorderedList>
        <ListItem>
          Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
        </ListItem>
        <UnorderedList>
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
          <ListItem>NYC: {formatMicroAmount(voterInfo.data?.nyc)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP020() {
  const isVoteActive = useCcip020VoteData("isVoteActive");
  const voteTotals = useCcip020VoteData("voteTotals");
  const voterInfo = useCcip020VoteData("voterInfo");
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
            <StatNumber>80, 81</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>80, 81</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>
              {voteTotals.data?.totals.totalVotesYes ?? <Spinner />}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>
              {voteTotals.data?.totals.totalVotesNo ?? <Spinner />}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBar
        yesTotal={voteTotals.data?.totals.totalAmountYes}
        noTotal={voteTotals.data?.totals.totalAmountNo}
      />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-020/ccips/ccip-020/ccip-020-graceful-protocol-shutdown.md"
            isExternal
          >
            CCIP-020
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown?chain=mainnet"
          isExternal
        >
          ccip-020-graceful-protocol-shutdown
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/feat/add-ccip-015/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          isExternal
        >
          CCIP-015
        </Link>
      </Stack>
      <Stack spacing={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          As the CityCoins Protocol prepares for the upcoming Nakamoto release
          on the Stacks blockchain[^1], the accumulation of technical debt with
          each change has made it increasingly challenging for core contributors
          and volunteers to keep up with the necessary updates. In light of
          these challenges and after careful consideration of community
          feedback, this CCIP proposes a graceful shutdown of the CityCoins
          Protocol.
        </Text>
        <Text>
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip020-graceful-protocol-shutdown?chain=mainnet"
            isExternal
          >
            CCIP-020
          </Link>{" "}
          implements the CCIP-015 voting mechanism as part of a DAO proposal to
          disable mining and stacking in the CityCoins protocol, freezing the
          total supply and unlocking any stacked CityCoins to claim.
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

export default CCIP020;
