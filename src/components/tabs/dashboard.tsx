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
import { atom, useAtom, useAtomValue } from "jotai";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";
import {
  miningClaimTransactionsAtom,
  miningTransactionsAtom,
  stackingClaimTransactionsAtom,
  stackingTransactionsAtom,
} from "../../store/citycoins";
import { Transaction } from "@stacks/stacks-blockchain-api-types";

type TransactionTypes =
  | "all"
  | "mining"
  | "mining-claims"
  | "stacking"
  | "stacking-claims";

const selectedTransactionTypeAtom = atom<TransactionTypes>("all");
const selectedTransactionsAtom = atom<Transaction[]>((get) => {
  const selectedTransactionType = get(selectedTransactionTypeAtom);
  const miningTransactions = get(miningTransactionsAtom);
  const miningClaimTransactions = get(miningClaimTransactionsAtom);
  const stackingTransactions = get(stackingTransactionsAtom);
  const stackingClaimTransactions = get(stackingClaimTransactionsAtom);

  switch (selectedTransactionType) {
    case "mining":
      return miningTransactions;
    case "mining-claims":
      return miningClaimTransactions;
    case "stacking":
      return stackingTransactions;
    case "stacking-claims":
      return stackingClaimTransactions;
    case "all":
    default:
      return [
        ...miningTransactions,
        ...miningClaimTransactions,
        ...stackingTransactions,
        ...stackingClaimTransactions,
      ];
  }
});

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
          <Stack direction={["column", null, "row"]}>
            <Stat>
              <StatLabel>Total Transactions</StatLabel>
              <StatNumber>{transactions.length}</StatNumber>
              <IconButton
                colorScheme={
                  selectedTransactionType === "all" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="sm"
                onClick={() => setSelectedTransactionType("all")}
              />
            </Stat>
            <Stat>
              <StatLabel>Total Mining TXs</StatLabel>
              <StatNumber>{miningTransactions.length}</StatNumber>
              <IconButton
                colorScheme={
                  selectedTransactionType === "mining" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="sm"
                onClick={() => setSelectedTransactionType("mining")}
              />
            </Stat>
            <Stat>
              <StatLabel>Total Mining Claim TXs</StatLabel>
              <StatNumber>{miningClaimTransactions.length}</StatNumber>
              <IconButton
                colorScheme={
                  selectedTransactionType === "mining-claims" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="sm"
                onClick={() => setSelectedTransactionType("mining-claims")}
              />
            </Stat>
            <Stat>
              <StatLabel>Total Stacking TXs</StatLabel>
              <StatNumber>{stackingTransactions.length}</StatNumber>
              <IconButton
                colorScheme={
                  selectedTransactionType === "stacking" ? "blue" : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="sm"
                onClick={() => setSelectedTransactionType("stacking")}
              />
            </Stat>
            <Stat>
              <StatLabel>Total Stacking Claim TXs</StatLabel>
              <StatNumber>{stackingClaimTransactions.length}</StatNumber>
              <IconButton
                colorScheme={
                  selectedTransactionType === "stacking-claims"
                    ? "blue"
                    : "gray"
                }
                icon={<MdFilterList />}
                aria-label="Filter transactions"
                title="Filter Transactions"
                size="sm"
                onClick={() => setSelectedTransactionType("stacking-claims")}
              />
            </Stat>
          </Stack>
          <Stack>
            <Text>Recent Transactions:</Text>
            <TransactionList transactions={selectedTransactions} />
          </Stack>
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
