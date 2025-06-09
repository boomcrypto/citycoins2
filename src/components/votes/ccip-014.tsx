import {
  Box,
  Link,
  Separator,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import VoteProgressBarV2 from "./vote-progress-bar-v2";
import { Ccip016VoteTotals } from "../../store/ccip-016";

function Ccip014() {
  const yesVotes = 34;
  const noVotes = 0;
  const yesTotal = 2254656703152000;
  const noTotal = 0;

  const voteTotalsObject: Ccip016VoteTotals = {
    mia: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    nyc: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    totals: {
      totalAmountYes: yesTotal,
      totalAmountNo: noTotal,
      totalVotesYes: yesVotes,
      totalVotesNo: noVotes,
    },
  };

  return (
    <Stack gap={4}>
      <Box
        textAlign={["left", "center"]}
        p={4}
      >
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
          <Stat.Root>
            <Stat.Label>MIA Cycles</Stat.Label>
            <Stat.ValueText>54, 55</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>NYC Cycles</Stat.Label>
            <Stat.ValueText>54, 55</Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <Stat.Label>Yes Vote Count</Stat.Label>
            <Stat.ValueText>{yesVotes}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText>{noVotes}</Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-014/ccip-014-upgrade-to-pox3.md"
          rel="noopener noreferrer"
          target="_blank"
        >
          CCIP-014
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign="end">
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3?chain=mainnet"
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip-014-pox-3
          </Link>
          ,
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3-v2?chain=mainnet"
            ml={2}
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip-014-pox-3-v2
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Link
          href="https://github.com/citycoins/governance/blob/feat/add-ccip-015/ccips/ccip-015/ccip-015-community-proposal-voting-process.md"
          rel="noopener noreferrer"
          target="_blank"
        >
          CCIP-015
        </Link>
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          The city treasury contracts used with mining directly call the .pox
          contract for stacking STX, which was disabled in Stacks 2.1 and
          replaced with .pox-3{" "}
          <Link
            href="https://forum.stacks.org/t/stacks-2-4-is-here-stacking-to-be-re-enabled/15024"
            rel="noopener noreferrer"
            target="_blank"
          >
            in the Stacks 2.4 release.
          </Link>
        </Text>
        <Text>
          The STX in each city's mining treasury was automatically unlocked as
          part of the upgrade, and the mining contract and treasury contract for
          each city must be updated to support the new .pox-3 contract.
        </Text>
        <Text>
          <Link
            href="https://github.com/citycoins/governance/blob/main/ccips/ccip-014/ccip-014-upgrade-to-pox3.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-014
          </Link>{" "}
          will implement a new version of the treasury contract
          ccd002-treasury-v2 that replaces .pox with .pox-3, as well as move the
          balances and perform the delegated stacking.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip014;
