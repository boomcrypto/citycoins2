import {
  Box,
  Divider,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import VoteProgressBar from "./vote-progress-bar";

function CCIP014() {
  const yesVotes = 34;
  const noVotes = 0;
  const yesTotal = 2254656703152000;
  const noTotal = 0;

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
            <StatNumber>54, 55</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>NYC Cycles</StatLabel>
            <StatNumber>54, 55</StatNumber>
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
        <Link
          href="https://github.com/citycoins/governance/blob/main/ccips/ccip-014/ccip-014-upgrade-to-pox3.md"
          isExternal
        >
          CCIP-014
        </Link>
      </Stack>
      <Stack direction={["column", "row"]} justifyContent="space-between">
        <Text fontWeight="bold">Related Contracts:</Text>
        <Box>
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3?chain=mainnet"
            isExternal
          >
            ccip-014-pox-3
          </Link>
          ,
          <Link
            href="https://explorer.hiro.so/txid/SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3-v2?chain=mainnet"
            ml={2}
            isExternal
          >
            ccip-014-pox-3-v2
          </Link>
        </Box>
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
          The city treasury contracts used with mining directly call the .pox
          contract for stacking STX, which was disabled in Stacks 2.1 and
          replaced with .pox-3{" "}
          <Link
            href="https://forum.stacks.org/t/stacks-2-4-is-here-stacking-to-be-re-enabled/15024"
            isExternal
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
            isExternal
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

export default CCIP014;
