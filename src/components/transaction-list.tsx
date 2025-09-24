import {
  Stack,
  Text,
  Spinner,
  Box,
  IconButton,
  Button,
  Link,
  Input,
  Badge,
  Table,
  NativeSelect,
  createListCollection,
} from "@chakra-ui/react";
import { IoMdRefresh } from "react-icons/io";
import { useAtom, useAtomValue } from "jotai";
import { transactionFetchStatusAtom, transactionsAtom } from "../store/stacks";
import { formatDate } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { useState } from "react";

import { getTxCategory } from "../utilities/transactions";

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
    const category = getTxCategory(tx) || "Other";
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
      const category = getTxCategory(tx) || "Other";
      if (category === "Mining") acc.mining++;
      else if (category === "Mining Claim") acc.miningClaims++;
      else if (category === "Stacking") acc.stacking++;
      else if (category === "Stacking Claim") acc.stackingClaims++;
      else if (category === "Transfer") acc.transfers++;
      return acc;
    },
    { mining: 0, miningClaims: 0, stacking: 0, stackingClaims: 0, transfers: 0 }
  );

  // Helper component for status indicator
  const StatusIndicator = () => (
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
    </Stack>
  );

  // Helper component for summaries
  const Summaries = () => (
    <Stack direction="row" gap={4} flexWrap="wrap">
      <Badge colorScheme={getCategoryColor("Mining")} variant="outline">
        Mining: {summaries.mining}
      </Badge>
      <Badge colorScheme={getCategoryColor("Mining Claim")} variant="outline">
        Mining Claims: {summaries.miningClaims}
      </Badge>
      <Badge colorScheme={getCategoryColor("Stacking")} variant="outline">
        Stacking: {summaries.stacking}
      </Badge>
      <Badge colorScheme={getCategoryColor("Stacking Claim")} variant="outline">
        Stacking Claims: {summaries.stackingClaims}
      </Badge>
      <Badge colorScheme={getCategoryColor("Transfer")} variant="outline">
        Transfers: {summaries.transfers}
      </Badge>
    </Stack>
  );

  // Helper component for filters
  const Filters = () => (
    <Stack direction={{ base: "column", md: "row" }} gap={4}>
      <NativeSelect.Root size="sm" width="full">
        <NativeSelect.Field
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {filterTypeCollection.items.map(
            (item: { value: string; label: string }) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            )
          )}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <NativeSelect.Root size="sm" width="full">
        <NativeSelect.Field
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {filterStatusCollection.items.map(
            (item: { value: string; label: string }) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            )
          )}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <Input
        placeholder="Search by TXID"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        width="full"
      />
    </Stack>
  );

  // Helper component for transaction table
  const TransactionTable = () => (
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
              const category = getTxCategory(tx) || "Other";
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
                        tx.tx_status === "success"
                          ? "green"
                          : tx.tx_status === "abort_by_response" ||
                            tx.tx_status === "abort_by_post_condition"
                          ? "red"
                          : "gray"
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

  return (
    <Stack gap={4}>
      <StatusIndicator />
      <Summaries />
      <Filters />
      <TransactionTable />
    </Stack>
  );
}

export default TransactionList;
