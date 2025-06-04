import {
  Button,
  Heading,
  IconButton,
  Separator,
  Stack,
  Stat,
  StatLabel,
  Text,
} from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { MdFilterList } from "react-icons/md";
import {
  TransactionTypes,
  miningClaimTransactionsAtom,
  miningTransactionsAtom,
  selectedTransactionTypeAtom,
  selectedTransactionsAtom,
  stackingClaimTransactionsAtom,
  stackingTransactionsAtom,
  votingTransactionsAtom,
} from "../../store/citycoins";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";

function Dashboard() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const transactions = useAtomValue(transactionsAtom);
  const miningTransactions = useAtomValue(miningTransactionsAtom);
  const miningClaimTransactions = useAtomValue(miningClaimTransactionsAtom);
  const stackingTransactions = useAtomValue(stackingTransactionsAtom);
  const stackingClaimTransactions = useAtomValue(stackingClaimTransactionsAtom);
  const votingTransactions = useAtomValue(votingTransactionsAtom);
  const [selectedTransactionType, setSelectedTransactionType] = useAtom(
    selectedTransactionTypeAtom
  );
  const selectedTransactions = useAtomValue(selectedTransactionsAtom);

  const selectTransactions = (type: TransactionTypes) => {
    if (type === selectedTransactionType) {
      setSelectedTransactionType("all");
    } else {
      setSelectedTransactionType(type);
    }
  };

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
        <Text size="sm">{`${transactions.length} transactions detected`}</Text>
        <Button onClick={() => selectTransactions("all")}>Show All</Button>
      </Stack>
      <Separator />
      {/* Transaction Stats and Filters */}
      <Stack
        direction={["column", null, "row"]}
        justifyContent="space-between"
        gap={2}
      >
        <Stack
          direction="row"
          alignContent="center"
          justifyContent="space-between"
        >
          <Stat.Root>
            <StatLabel>Mining TXs</StatLabel>
            <Stat.Label>{miningTransactions.length}</Stat.Label>
          </Stat.Root>
          <IconButton
            colorScheme={selectedTransactionType === "mining" ? "blue" : "gray"}
            icon={<MdFilterList />}
            aria-label="Filter transactions"
            title="Filter Transactions"
            size="xs"
            onClick={() => selectTransactions("mining")}
          />
        </Stack>
        <Stack
          direction="row"
          alignContent="center"
          justifyContent="space-between"
        >
          <Stat.Root>
            <StatLabel>Mining Claim TXs</StatLabel>
            <Stat.Label>{miningClaimTransactions.length}</Stat.Label>
          </Stat.Root>
          <IconButton
            colorScheme={
              selectedTransactionType === "mining-claims" ? "blue" : "gray"
            }
            icon={<MdFilterList />}
            aria-label="Filter transactions"
            title="Filter Transactions"
            size="xs"
            onClick={() => selectTransactions("mining-claims")}
          />
        </Stack>
        <Stack
          direction="row"
          alignContent="center"
          justifyContent="space-between"
        >
          <Stat.Root>
            <StatLabel>Stacking TXs</StatLabel>
            <Stat.Label>{stackingTransactions.length}</Stat.Label>
          </Stat.Root>
          <IconButton
            colorScheme={
              selectedTransactionType === "stacking" ? "blue" : "gray"
            }
            icon={<MdFilterList />}
            aria-label="Filter transactions"
            title="Filter Transactions"
            size="xs"
            onClick={() => selectTransactions("stacking")}
          />
        </Stack>
        <Stack
          direction="row"
          alignContent="center"
          justifyContent="space-between"
        >
          <Stat.Root>
            <StatLabel>Stacking Claim TXs</StatLabel>
            <Stat.Label>{stackingClaimTransactions.length}</Stat.Label>
          </Stat.Root>
          <IconButton
            colorScheme={
              selectedTransactionType === "stacking-claims" ? "blue" : "gray"
            }
            icon={<MdFilterList />}
            aria-label="Filter transactions"
            title="Filter Transactions"
            size="xs"
            onClick={() => selectTransactions("stacking-claims")}
          />
        </Stack>
        <Stack
          direction="row"
          alignContent="center"
          justifyContent="space-between"
        >
          <Stat.Root>
            <StatLabel>Voting TXs</StatLabel>
            <Stat.Label>{votingTransactions.length}</Stat.Label>
          </Stat.Root>
          <IconButton
            colorScheme={selectedTransactionType === "voting" ? "blue" : "gray"}
            icon={<MdFilterList />}
            aria-label="Filter transactions"
            title="Filter Transactions"
            size="xs"
            onClick={() => selectTransactions("voting")}
          />
        </Stack>
      </Stack>
      <Separator />
      <TransactionList transactions={selectedTransactions} />
    </Stack>
  );
}

export default Dashboard;
