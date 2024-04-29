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
import { useAtomValue } from "jotai";
import { useCcip021VoteData } from "../../hooks/use-ccip-021-vote-data";
import { formatMicroAmount } from "../../store/common";
import { hasVotedAtom } from "../../store/ccip-021";
import VoteProgressBar from "./vote-progress-bar";

/*
function VoteButtons() {
  const { voteYes, voteNo, isRequestPending } = useCcip021VoteActions();
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
*/

function VoteResult() {
  const voterInfo = useCcip021VoteData("voterInfo");

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

function CCIP021() {
  const voterInfo = useCcip021VoteData("voterInfo");

  const yesVotes = 65;
  const noVotes = 0;
  const yesTotal = 3952952766000000;
  const noTotal = 0;

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
            <StatNumber>{yesVotes}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>{noVotes}</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBar yesTotal={yesTotal} noTotal={noTotal} />
      <Divider />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-021/ccip-021-extend-direct-execute-sunset-period-2.md"
            isExternal
          >
            CCIP-021
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Link
          href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2?chain=mainnet"
          isExternal
        >
          ccip-021-extend-sunset-period-2
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
          When the ccd001-direct-execute Clarity contract was deployed, a sunset
          height of 25,920 Stacks blocks or approximately 6 months was set,
          after which the extension will no longer be able to execute proposals.
          The current sunset height is 147,828.
        </Text>
        <Text>
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip021-extend-sunset-period-2?chain=mainnet"
            isExternal
          >
            CCIP-021
          </Link>{" "}
          implements the CCIP-015 voting mechanism as part of a DAO proposal to
          extend the sunset period by an additional 25,920 Stacks blocks, with
          the new sunset period ending at Stacks block 173,748.
        </Text>
      </Stack>
      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP021;
