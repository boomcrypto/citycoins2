import {
  Stack,
  Text,
  Spinner,
  Box,
  IconButton,
  Portal,
  Button,
  Link,
  Input,
  Badge,
  Table,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { IoMdRefresh } from "react-icons/io";
import { useAtom, useAtomValue } from "jotai";
import { transactionFetchStatusAtom, transactionsAtom } from "../store/stacks";
import { formatDate } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { useState } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onOpenDetails: (tx: Transaction) => void;
}

function shortenPrincipal(addr: string): string {
  if (!addr) return "";
  if (addr.includes(".")) {
    const [address, contract] = addr.split(".");
    return `${address.slice(0, 5)}...${address.slice(-5)}.${contract}`;
  }
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
}

function shortenTxId(txId: string): string {
  return txId ? `${txId.slice(0, 6)}...${txId.slice(-4)}` : "";
}

function getCategory(tx: Transaction): string {
  if (tx.tx_type === "contract_call") {
    const func = tx.contract_call.function_name;
    if (["mine-tokens", "mine-many", "mine"].includes(func)) {
      return "Mining";
    } else if (func === "claim-mining-reward") {
      return "Mining Claim";
    } else if (["stack-tokens", "stack"].includes(func)) {
      return "Stacking";
    } else if (func === "claim-stacking-reward") {
      return "Stacking Claim";
    } else if (func === "transfer") {
      return "Transfer";
    }
  }
  return "Other";
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Mining":
      return "green";
    case "Mining Claim":
      return "blue";
    case "Stacking":
      return "purple";
    case "Stacking Claim":
      return "orange";
    case "Transfer":
      return "yellow";
    default:
      return "gray";
  }
}

const filterTypeCollection = createListCollection({
  items: [
    { label: "All Types", value: "All" },
    { label: "Mining", value: "Mining" },
    { label: "Mining Claim", value: "Mining Claim" },
    { label: "Stacking", value: "Stacking" },
    { label: "Stacking Claim", value: "Stacking Claim" },
    { label: "Transfer", value: "Transfer" },
    { label: "Other", value: "Other" },
  ],
});

const filterStatusCollection = createListCollection({
  items: [
    { label: "All Statuses", value: "All" },
    { label: "Success", value: "success" },
    { label: "Failed", value: "failed" },
  ],
});

function TransactionList({
  transactions,
  onOpenDetails,
}: TransactionListProps) {
  const [allTransactions, updateTransactions] = useAtom(transactionsAtom);
  const { isLoading, error, progress } = useAtomValue(
    transactionFetchStatusAtom
  );

  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter((tx) => {
    if (
      searchTerm &&
      !tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filterStatus !== "All" && tx.tx_status !== filterStatus) return false;
    const category = getCategory(tx);
    if (filterType !== "All" && category !== filterType) return false;
    return true;
  });

  const fetchTransactions = async () => {
    if (isLoading) return;
    try {
      await updateTransactions(allTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleOpenDetails = (tx: Transaction) => {
    onOpenDetails(tx);
  };

  // Compute summaries
  const summaries = filteredTransactions.reduce(
    (acc, tx) => {
      const category = getCategory(tx);
      if (category === "Mining") acc.mining++;
      else if (category === "Mining Claim") acc.miningClaims++;
      else if (category === "Stacking") acc.stacking++;
      else if (category === "Stacking Claim") acc.stackingClaims++;
      else if (category === "Transfer") acc.transfers++;
      return acc;
    },
    { mining: 0, miningClaims: 0, stacking: 0, stackingClaims: 0, transfers: 0 }
  );

  return (
    <Stack gap={4}>
      <Stack direction="row" alignItems="center" minH="2em">
        <Box
          w={3}
          h={3}
          borderRadius="50%"
          bg={isLoading ? "yellow.500" : error ? "red.500" : "green.500"}
        />
        {isLoading && (
          <Stack
            direction="row"
            align="center"
            justifyContent="space-between"
            w="100%"
          >
            <Text>Loading transactions... {progress}%</Text>
            <Spinner size="sm" />
          </Stack>
        )}

        {error && <Text color="red.500">Error: {error}</Text>}

        {!isLoading && !error && (
          <Stack
            direction="row"
            align="center"
            justifyContent="space-between"
            w="100%"
          >
            <Text>
              {allTransactions.length > 0
                ? `Filtered transactions: ${filteredTransactions.length} / ${allTransactions.length}`
                : "No transactions loaded yet"}
            </Text>
            <IconButton
              aria-label="Refresh Transactions"
              title="Refresh Transactions"
              size="sm"
              onClick={fetchTransactions}
            >
              <IoMdRefresh />
            </IconButton>
          </Stack>
        )}
      <Stack direction="row" gap={4} flexWrap="wrap">
        <Badge colorScheme="green" variant="outline">
          Mining: {summaries.mining}
        </Badge>
        <Badge colorScheme="blue" variant="outline">
          Mining Claims: {summaries.miningClaims}
        </Badge>
        <Badge colorScheme="purple" variant="outline">
          Stacking: {summaries.stacking}
        </Badge>
        <Badge colorScheme="orange" variant="outline">
          Stacking Claims: {summaries.stackingClaims}
        </Badge>
        <Badge colorScheme="yellow" variant="outline">
          Transfers: {summaries.transfers}
        </Badge>
      </Stack>
      <Stack direction="row" gap={4} flexWrap="wrap">
        <Select.Root
          collection={filterTypeCollection}
          value={[filterType]}
          onValueChange={(e) => setFilterType(e.value[0])}
          size="sm"
          w="auto"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText>All Types</Select.ValueText>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {filterTypeCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Select.Root>
        <Select.Root
          collection={filterStatusCollection}
          value={[filterStatus]}
          onValueChange={(e) => setFilterStatus(e.value[0])}
          size="sm"
          w="auto"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText>All Statuses</Select.ValueText>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {filterStatusCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
            </Portal>
        </Select.Root>
        <Input
          placeholder="Search by TXID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          w="auto"
        />
      <Box overflowX="auto">
        <Table.Root variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>TXID</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredTransactions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center">
                  No transactions found.
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredTransactions.map((tx) => {
                const category = getCategory(tx);
                return (
                  <Table.Row key={tx.tx_id}>
                    <Table.Cell>
                      <Link
                        href={`https://explorer.hiro.so/tx/${tx.tx_id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {shortenTxId(tx.tx_id)}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorScheme={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorScheme={
                          tx.tx_status === "success" ? "green" : "red"
                        }
                      >
                        {tx.tx_status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(tx.block_time_iso)}</Table.Cell>
                    <Table.Cell>
                      <Button size="sm" onClick={() => handleOpenDetails(tx)}>
                        Details
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>
  );
}

export default TransactionList;
