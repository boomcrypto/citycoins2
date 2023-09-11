import {
  Box,
  Button,
  Divider,
  Link,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import VoteProgressBar from "./vote-progress-bar";
import { useCcip017 } from "../../hooks/use-ccip-017";

// TODO: button onClick handlers
// submits contract calls

function voteYes() {
  return undefined;
}

function voteNo() {
  return undefined;
}

// TODO: fetch current status from contract and display option below

function VoteButtons() {
  return (
    <Stack direction={["column", "row"]} spacing={4}>
      <Button onClick={voteYes()} colorScheme="green" size="lg" isDisabled>
        Vote Yes
      </Button>
      <Button onClick={voteNo()} colorScheme="red" size="lg" isDisabled>
        Vote No
      </Button>
    </Stack>
  );
}

function VoteResult() {
  return (
    <Stack spacing={4}>
      <Text>Vote recorded, thank you!</Text>
    </Stack>
  );
}

function CCIP017() {
  const isExecutable = useCcip017("isExecutable");
  const isVoteActive = useCcip017("isVoteActive");
  const voteTotals = useCcip017("voteTotals");
  const voterInfo = useCcip017("voterInfo");

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
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
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
        <Text>
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip017-extend-sunset-period?chain=mainnet"
            isExternal
          >
            ccip-017-extend-sunset-period
          </Link>
          {" | "}
          <Link
            href="https://github.com/citycoins/protocol/blob/fix/extend-direct-execute-sunset-period/contracts/proposals/ccip017-extend-direct-execute-sunset-period.clar"
            isExternal
          >
            github
          </Link>
        </Text>
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
      <VoteButtons />
    </Stack>
  );
}

export default CCIP017;
