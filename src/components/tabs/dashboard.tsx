import {
  Button,
  Heading,
  Separator,
  Stack,
  Stat,
  StatLabel,
  Text,
} from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import {
  miningClaimTransactionsAtom,
  miningTransactionsAtom,
  stackingClaimTransactionsAtom,
  stackingTransactionsAtom,
  votingTransactionsAtom,
} from "../../store/citycoins";
import {
  stxAddressAtom,
  transactionFetchStatusAtom,
  transactionsAtom,
} from "../../store/stacks";
import SignIn from "../auth/sign-in";

function Dashboard() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const transactions = useAtomValue(transactionsAtom);
  const miningTransactions = useAtomValue(miningTransactionsAtom);
  const miningClaimTransactions = useAtomValue(miningClaimTransactionsAtom);
  const stackingTransactions = useAtomValue(stackingTransactionsAtom);
  const stackingClaimTransactions = useAtomValue(stackingClaimTransactionsAtom);
  const votingTransactions = useAtomValue(votingTransactionsAtom);
  const [allTransactions, updateTransactions] = useAtom(transactionsAtom);
  const fetchStatus = useAtomValue(transactionFetchStatusAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>CityCoins Dashboard</Heading>
        <Text>Wallet connection required to access dashboard.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>CityCoins Dashboard</Heading>

      <Stack
        direction={["column", null, "row"]}
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Text fontWeight="bold">{stxAddress}</Text>
        <Text fontSize="sm">{`${transactions.length} transactions detected`}</Text>
      </Stack>
      <Separator />
      {/* Transaction Stats */}
      <Stack
        direction={["column", null, "row"]}
        justifyContent="space-between"
        gap={2}
      >
        <Stat.Root>
          <StatLabel>Mining TXs</StatLabel>
          <Stat.Label>{miningTransactions.length}</Stat.Label>
        </Stat.Root>
        <Stat.Root>
          <StatLabel>Mining Claim TXs</StatLabel>
          <Stat.Label>{miningClaimTransactions.length}</Stat.Label>
        </Stat.Root>
        <Stat.Root>
          <StatLabel>Stacking TXs</StatLabel>
          <Stat.Label>{stackingTransactions.length}</Stat.Label>
        </Stat.Root>
        <Stat.Root>
          <StatLabel>Stacking Claim TXs</StatLabel>
          <Stat.Label>{stackingClaimTransactions.length}</Stat.Label>
        </Stat.Root>
        <Stat.Root>
          <StatLabel>Voting TXs</StatLabel>
          <Stat.Label>{votingTransactions.length}</Stat.Label>
        </Stat.Root>
      </Stack>
      {fetchStatus.isLoading && (
        <Text>Loading stats... {fetchStatus.progress}%</Text>
      )}
      {fetchStatus.error && (
        <Text color="red.500">Error: {fetchStatus.error}</Text>
      )}
      <Button onClick={() => updateTransactions(allTransactions)}>
        Refresh Stats
      </Button>
      <Text>Switch to MIA or NYC tab for detailed transactions and tools.</Text>
    </Stack>
  );
}

export default Dashboard;
