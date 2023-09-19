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
import VoteProgressBar from "./vote-progress-bar";
import { useCcip017VoteData } from "../../hooks/use-ccip-017-vote-data";
import { useCcip017VoteActions } from "../../hooks/use-ccip-017-vote-actions";
import { formatMicroAmount } from "../../store/common";
import { hasVotedAtom } from "../../store/ccip-017";
import { useAtomValue } from "jotai";

function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip017VoteActions();
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
  const voterInfo = useCcip017VoteData("voterInfo");

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

function CCIP017() {
  const voteTotals = useCcip017VoteData("voteTotals");
  const voterInfo = useCcip017VoteData("voterInfo");

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
            <StatNumber>64, 65</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>64, 65</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Count</StatLabel>
            <StatNumber>{voteTotals.data?.yesVotes ?? <Spinner />}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>{voteTotals.data?.noVotes ?? <Spinner />}</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBar
        yesTotal={voteTotals.data?.yesTotal}
        noTotal={voteTotals.data?.noTotal}
      />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-017/ccips/ccip-017/ccip-017-extend-direct-execute-sunset-period.md"
            isExternal
          >
            CCIP-017
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period?chain=mainnet"
          isExternal
        >
          ccip-017-extend-sunset-period
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
          When the ccd001-direct-execute Clarity contract was deployed, a sunset
          height of 25,920 Stacks blocks or approximately 6 months was set,
          after which the extension will no longer be able to execute proposals.{" "}
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd001-direct-execute?chain=mainnet"
            isExternal
          >
            As seen on the explorer
          </Link>
          , the contract was deployed at Stacks block height 95,988 and will
          reach the sunset height at Stacks block 121,908.
        </Text>
        <Text>
          <Link
            href="https://github.com/citycoins/governance/blob/feat/add-ccip-017/ccips/ccip-017/ccip-017-extend-direct-execute-sunset-period.md"
            isExternal
          >
            CCIP-017
          </Link>{" "}
          implements the CCIP-015 voting mechanism as part of a DAO proposal to
          extend the sunset period by an additional 25,920 Stacks blocks, with
          the new sunset period ending at Stacks block 147,828.
        </Text>
      </Stack>
      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP017;
