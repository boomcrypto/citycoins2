import {
  Button,
  Divider,
  Heading,
  IconButton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { MdFilterList } from "react-icons/md";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import { useAtom, useAtomValue } from "jotai";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";
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
      <Divider />
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
          <Stat>
            <StatLabel>Mining TXs</StatLabel>
            <StatNumber>{miningTransactions.length}</StatNumber>
          </Stat>
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
          <Stat>
            <StatLabel>Mining Claim TXs</StatLabel>
            <StatNumber>{miningClaimTransactions.length}</StatNumber>
          </Stat>
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
          <Stat>
            <StatLabel>Stacking TXs</StatLabel>
            <StatNumber>{stackingTransactions.length}</StatNumber>
          </Stat>
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
          <Stat>
            <StatLabel>Stacking Claim TXs</StatLabel>
            <StatNumber>{stackingClaimTransactions.length}</StatNumber>
          </Stat>
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
          <Stat>
            <StatLabel>Voting TXs</StatLabel>
            <StatNumber>{votingTransactions.length}</StatNumber>
          </Stat>
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
      <Divider />
      <TransactionList transactions={selectedTransactions} />
    </Stack>
  );
}

export default Dashboard;
