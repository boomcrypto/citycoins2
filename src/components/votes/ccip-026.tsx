import { Box, Link, Separator, Stack, Stat, Text } from "@chakra-ui/react";
import { Ccip016VoteTotals } from "../../store/ccip-016";
import VoteProgressBarV2 from "./vote-progress-bar-v2";

const CCIP_026_CONTRACT =
  "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ccip026-miamicoin-burn-to-exit";
const CCD_013_CONTRACT =
  "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ccd013-burn-to-exit-mia";
const DIRECT_EXECUTE_CONTRACT =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd001-direct-execute";

function Ccip026() {
  const yesVotes = 39;
  const noVotes = 0;
  const yesTotal = 1638177567500000;
  const noTotal = 0;

  const voteTotalsObject: Ccip016VoteTotals = {
    mia: {
      totalAmountYes: yesTotal,
      totalAmountNo: noTotal,
      totalVotesYes: yesVotes,
      totalVotesNo: noVotes,
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
      <Box textAlign={["left", "center"]} p={4}>
        <Stack
          direction={["column", "row"]}
          justifyContent="space-between"
          mb={[2, 4]}
        >
          <Stat.Root>
            <Stat.Label>MIA Cycles</Stat.Label>
            <Stat.ValueText>82, 83</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>Bitcoin Blocks</Stat.Label>
            <Stat.ValueText>946,772 - 948,788</Stat.ValueText>
          </Stat.Root>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat.Root>
            <Stat.Label>Yes Vote Count</Stat.Label>
            <Stat.ValueText title={yesVotes.toString()}>
              {yesVotes}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>No Vote Count</Stat.Label>
            <Stat.ValueText title={noVotes.toString()}>
              {noVotes}
            </Stat.ValueText>
          </Stat.Root>
        </Stack>
      </Box>
      <VoteProgressBarV2 props={voteTotalsObject} />
      <Separator />
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Execution Status:</Text>
        <Box textAlign={["left", "end"]}>
          <Text>Passed; awaiting direct-execute multisig completion.</Text>
          <Text color="fg.muted" fontSize="sm">
            The on-chain executable check returns true. Redemption is not enabled yet.
          </Text>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related CCIPs:</Text>
        <Box>
          <Link
            href="https://github.com/citycoins/governance/blob/d73c5d9bbd51f785454e60790b4b6be74d42d63d/ccips/ccip-026/ccip-026-miamicoin-burn-to-exit.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            CCIP-026
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box textAlign={["left", "end"]}>
          <Link
            href={`https://explorer.hiro.so/txid/${CCIP_026_CONTRACT}?chain=mainnet`}
            rel="noopener noreferrer"
            target="_blank"
          >
            ccip026-miamicoin-burn-to-exit
          </Link>
          <br />
          <Link
            href={`https://explorer.hiro.so/txid/${CCD_013_CONTRACT}?chain=mainnet`}
            rel="noopener noreferrer"
            target="_blank"
          >
            ccd013-burn-to-exit-mia
          </Link>
          <br />
          <Link
            href={`https://explorer.hiro.so/txid/${DIRECT_EXECUTE_CONTRACT}?chain=mainnet`}
            rel="noopener noreferrer"
            target="_blank"
          >
            ccd001-direct-execute
          </Link>
        </Box>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Voting Method:</Text>
        <Box textAlign={["left", "end"]}>
          <Text>Merkle snapshot voting</Text>
          <Text color="fg.muted" fontSize="sm">
            Snapshot root committed in the proposal contract.
          </Text>
        </Box>
      </Stack>
      <Stack gap={2}>
        <Text fontWeight="bold">Details:</Text>
        <Text>
          CCIP-026 enables a MiamiCoin burn-to-exit mechanism. Eligible MIA
          holders voted using a Merkle snapshot from MIA stacking cycles 82 and
          83. The vote passed with 1,638,177,567.5 MIA voting yes and 0 MIA
          voting no.
        </Text>
        <Text>
          Once execution receives the required direct-execute signer threshold,
          the DAO will enable the CCD013 burn-to-exit extension and initialize
          redemption. The redemption ratio is sized from the MIA mining treasury
          snapshot, while payouts are made from the MIA rewards treasury.
        </Text>
      </Stack>
    </Stack>
  );
}

export default Ccip026;
