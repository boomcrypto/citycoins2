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
import { useCcip022VoteData } from "../../hooks/use-ccip-022-vote-data";
import { formatMicroAmount } from "../../store/common";
import { Ccip022VoteTotals } from "../../store/ccip-022";
import VoteProgressBarCCIP022 from "./vote-progress-bar-ccip022";

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

  const yesVotes = 132;
  const noVotes = 4;
  const totalVoteCount = yesVotes + noVotes;
  const yesTotal = 1404542830929124;
  const noTotal = 1250562992000000;

  const voteTotalsObject: Ccip022VoteTotals = {
    nyc: {
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
            <StatLabel>NYC Cycles</StatLabel>
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
            <StatNumber title={`NYC ${yesVotes}`}>{yesVotes}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber title={`NYC ${noVotes}`}>{noVotes}</StatNumber>
          </Stat>
        </Stack>
      </Box>
      <VoteProgressBarCCIP022 props={voteTotalsObject} />
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
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip022-treasury-redemption-nyc?chain=mainnet"
            isExternal
          >
            ccip022-treasury-redemption-nyc
          </Link>
          <br />
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc?chain=mainnet"
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
      {/*
      isVoteActive.data && hasVoted ? (
        <>
          <Divider />
          <Text fontWeight="bold">Vote recorded, thank you!</Text>
          <Text>Refresh to see stats once the tx confirms.</Text>
        </>
      ) : (
        <VoteButtons />
      )
      */}
      {voterInfo.data && <VoteResult />}
    </Stack>
  );
}

export default CCIP022;
