import {
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
  miningClaimTransactionsAtom,
  miningTransactionsAtom,
  selectedTransactionTypeAtom,
  selectedTransactionsAtom,
  stackingClaimTransactionsAtom,
  stackingTransactionsAtom,
} from "../../store/citycoins";

function Dashboard() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const transactions = useAtomValue(transactionsAtom);
  const miningTransactions = useAtomValue(miningTransactionsAtom);
  const miningClaimTransactions = useAtomValue(miningClaimTransactionsAtom);
  const stackingTransactions = useAtomValue(stackingTransactionsAtom);
  const stackingClaimTransactions = useAtomValue(stackingClaimTransactionsAtom);
  const [selectedTransactionType, setSelectedTransactionType] = useAtom(
    selectedTransactionTypeAtom
  );
  const selectedTransactions = useAtomValue(selectedTransactionsAtom);

  return (
    <Stack spacing={4}>
      <Heading>CityCoins Dashboard</Heading>
      {stxAddress ? (
        <>
          <Text fontWeight="bold">{stxAddress}</Text>
          {/* Transaction Stats and Filters */}
          <Stack
            direction={["column", null, "row"]}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack
              direction="row"
              alignContent="center"
              justifyContent="space-between"
            >
              <Stat>
                <StatLabel>Total Transactions</StatLabel>
                <StatNumber>{transactions.length}</StatNumber>
              </Stat>
              <IconButton
                colorScheme={
                  selectedTransactionType === "all" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="xs"
                onClick={() => setSelectedTransactionType("all")}
              />
            </Stack>
            <Stack
              direction="row"
              alignContent="center"
              justifyContent="space-between"
            >
              <Stat>
                <StatLabel>Total Mining TXs</StatLabel>
                <StatNumber>{miningTransactions.length}</StatNumber>
              </Stat>
              <IconButton
                colorScheme={
                  selectedTransactionType === "mining" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="xs"
                onClick={() => setSelectedTransactionType("mining")}
              />
            </Stack>
            <Stack
              direction="row"
              alignContent="center"
              justifyContent="space-between"
            >
              <Stat>
                <StatLabel>Total Mining Claim TXs</StatLabel>
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
                onClick={() => setSelectedTransactionType("mining-claims")}
              />
            </Stack>
            <Stack
              direction="row"
              alignContent="center"
              justifyContent="space-between"
            >
              <Stat>
                <StatLabel>Total Stacking TXs</StatLabel>
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
                onClick={() => setSelectedTransactionType("stacking")}
              />
            </Stack>
            <Stack
              direction="row"
              alignContent="center"
              justifyContent="space-between"
            >
              <Stat>
                <StatLabel>Total Stacking Claim TXs</StatLabel>
                <StatNumber>{stackingClaimTransactions.length}</StatNumber>
              </Stat>
              <IconButton
                colorScheme={
                  selectedTransactionType === "stacking-claims"
                    ? "blue"
                    : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="xs"
                onClick={() => setSelectedTransactionType("stacking-claims")}
              />
            </Stack>
          </Stack>
          <TransactionList transactions={selectedTransactions} />
        </>
      ) : (
        <>
          <Text>Wallet connection required to access dashboard.</Text>
          <SignIn />
        </>
      )}
    </Stack>
  );
}

export default Dashboard;
