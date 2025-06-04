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
import { useCcip020VoteData } from "../../hooks/use-ccip-020-vote-data";
import { formatMicroAmount } from "../../store/common";
import { Ccip020VoteTotals } from "../../store/ccip-020";
import VoteProgressBarV2 from "./vote-progress-bar-v2";

function VoteResult() {
  const voterInfo = useCcip020VoteData("voterInfo");

  return (
    <Stack gap={4}>
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
  const voterInfo = useCcip020VoteData("voterInfo");

  const yesVotesMia = 53;
  const yesVotesNyc = 65;
  const yesVotesTotal = yesVotesMia + yesVotesNyc;

  const yesVoteAmountMia = 1716065533000000;
  const yesVoteAmountNyc = 2282041983000000;
  const yesVoteAmountTotal = yesVoteAmountMia + yesVoteAmountNyc;

  const noVotesMia = 3;
  const noVotesNyc = 3;
  const noVotesTotal = noVotesMia + noVotesNyc;

  const noVoteAmountMia = 66417390000000;
  const noVoteAmountNyc = 9370136000000;
  const noVoteAmountTotal = noVoteAmountMia + noVoteAmountNyc;

  const voteTotalsObj: Ccip020VoteTotals = {
    mia: {
      totalAmountYes: yesVoteAmountMia,
      totalAmountNo: noVoteAmountMia,
      totalVotesYes: yesVotesMia,
      totalVotesNo: noVotesMia,
    },
    nyc: {
      totalAmountYes: yesVoteAmountNyc,
      totalAmountNo: noVoteAmountNyc,
      totalVotesYes: yesVotesNyc,
      totalVotesNo: noVotesNyc,
    },
    totals: {
      totalAmountYes: yesVoteAmountTotal,
      totalAmountNo: noVoteAmountTotal,
      totalVotesYes: yesVotesTotal,
      totalVotesNo: noVotesTotal,
    },
  };

  return (
    <Stack gap={4}>
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
            <StatNumber title={`MIA ${yesVotesMia} / NYC ${yesVotesNyc}`}>
              {yesVotesTotal}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`MIA ${noVotesMia} / NYC ${noVotesNyc}`}>
              {noVotesTotal}
            </StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObj} />
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
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          As the CityCoins Protocol prepares for the{" "}
          <Link
            href="https://docs.stacks.co/nakamoto-upgrade/nakamoto-rollout-plan"
            isExternal
          >
            upcoming Nakamoto release on the Stacks blockchain
          </Link>
          , the accumulation of technical debt with each change has made it
          increasingly challenging for core contributors and volunteers to keep
          up with the necessary updates. In light of these challenges and after
          careful consideration of community feedback, this CCIP proposes a
          graceful shutdown of the CityCoins Protocol.
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
      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP020;
