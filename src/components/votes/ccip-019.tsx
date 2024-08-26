import {
  Box,
  Code,
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
import { useCcip019VoteData } from "../../hooks/use-ccip-019-vote-data";
import { formatMicroAmount } from "../../store/common";
import { Ccip019VoteTotals } from "../../store/ccip-019";
import VoteProgressBarMiaOnly from "./vote-progress-bar-mia-only";

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
          <ListItem>MIA: {formatMicroAmount(voterInfo.data?.mia)}</ListItem>
        </UnorderedList>
      </UnorderedList>
    </Stack>
  );
}

function CCIP019() {
  const voterInfo = useCcip019VoteData("voterInfo");

  const yesVotes = 56;
  const noVotes = 0;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 1933337130000000;
  const noTotal = 0;

  const voteTotalsObject: Ccip019VoteTotals = {
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
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip019-pox-4-stacking?chain=mainnet"
            isExternal
          >
            ccip019-pox-4-stacking
          </Link>
          ,{" "}
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-mining-v3?chain=mainnet"
            isExternal
          >
            ccd002-treasury-mia-mining-v3
          </Link>
          ,{" "}
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-rewards-v3?chain=mainnet"
            isExternal
          >
            ccd002-treasury-mia-rewards-v3
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

      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP019;
