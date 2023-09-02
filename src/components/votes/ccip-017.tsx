import {
  Box,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";

function CCIP017() {
  return (
    <Stack spacing={4}>
      <Box textAlign={["left", "center"]} bg="gray.900" p={4}>
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
            <StatNumber>TBD</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Count</StatLabel>
            <StatNumber>TBD</StatNumber>
          </Stat>
        </Stack>
        <Stack direction={["column", "row"]} justifyContent="space-between">
          <Stat>
            <StatLabel>Yes Vote Total</StatLabel>
            <StatNumber>TBD</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>No Vote Total</StatLabel>
            <StatNumber>TBD</StatNumber>
          </Stat>
        </Stack>
      </Box>
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
          href="https://github.com/citycoins/protocol/blob/fix/extend-direct-execute-sunset-period/contracts/proposals/ccip017-extend-direct-execute-sunset-period.clar"
          isExternal
        >
          ccip-017-extend-direct-execute-sunset-period
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
        <Text>TODO</Text>
      </Stack>
    </Stack>
  );
}

export default CCIP017;
