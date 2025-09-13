import {
  Stack,
  Text,
  Spinner,
  Box,
  IconButton,
  Portal,
  Button,
  Grid,
  Link,
  Input,
  Badge,
  Table,
  Select,
  createListCollection,
  useDisclosure,
  Dialog,
  List,
  Fragment,
} from "@chakra-ui/react";
import { IoMdRefresh } from "react-icons/io";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { transactionFetchStatusAtom, transactionsAtom } from "../store/stacks";
import { formatDate, formatMicroAmount } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { Fragment, useState } from "react";
import { decodeTxArgs, isValidMiningTxArgs, isValidStackingTxArgs, isValidMiningClaimTxArgs, isValidStackingClaimTxArgs } from "../utilities/transactions";

interface TransactionListProps {
  transactions: Transaction[];
}

interface TransactionFunctionArgsProps {
  functionArgs: {
    hex: string;
    repr: string;
    name: string;
    type: string;
  }[];
}

interface TransactionDetailsDialogProps {
  tx: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

function shortenPrincipal(addr: string): string {
  return addr ? `${addr.slice(0, 5)}...${addr.slice(-5)}` : '';
}

function shortenTxId(txId: string): string {
  return txId ? `${txId.slice(0, 6)}...${txId.slice(-4)}` : '';
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
    case "Mining": return "green";
    case "Mining Claim": return "blue";
    case "Stacking": return "purple";
    case "Stacking Claim": return "orange";
    case "Transfer": return "yellow";
    default: return "gray";
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

function TransactionList({ transactions }: TransactionListProps) {
  const [allTransactions, updateTransactions] = useAtom(transactionsAtom);
  const { isLoading, error, progress } = useAtomValue(
    transactionFetchStatusAtom
  );

  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    if (searchTerm && !tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'All' && tx.tx_status !== filterStatus) return false;
    const category = getCategory(tx);
    if (filterType !== 'All' && category !== filterType) return false;
    return true;
  });

  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    if (isLoading) return;
    try {
      await updateTransactions(allTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleOpenDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    onOpen();
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
    <>
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
        </Stack>
        <Stack direction="row" gap={4} flexWrap="wrap">
          <Badge colorScheme="green" variant="outline">Mining: {summaries.mining}</Badge>
          <Badge colorScheme="blue" variant="outline">Mining Claims: {summaries.miningClaims}</Badge>
          <Badge colorScheme="purple" variant="outline">Stacking: {summaries.stacking}</Badge>
          <Badge colorScheme="orange" variant="outline">Stacking Claims: {summaries.stackingClaims}</Badge>
          <Badge colorScheme="yellow" variant="outline">Transfers: {summaries.transfers}</Badge>
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
            </Portal>
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
          <Input placeholder="Search by TXID" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} w="auto" />
        </Stack>
        <Box overflowX="auto">
          {filteredTransactions.length === 0 && <Text>No transactions found.</Text>}
          {filteredTransactions.length > 0 && (
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
                {filteredTransactions.map((tx) => {
                  const category = getCategory(tx);
                  return (
                    <Table.Row key={tx.tx_id}>
                      <Table.Cell>
                        <Link href={`https://explorer.hiro.so/tx/${tx.tx_id}`} rel="noopener noreferrer" target="_blank">
                          {shortenTxId(tx.tx_id)}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={getCategoryColor(category)}>{category}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={tx.tx_status === 'success' ? 'green' : 'red'}>
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
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
      <TransactionDetailsDialog
        tx={selectedTx}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}


function TransactionFunctionArgs({
  functionArgs,
}: TransactionFunctionArgsProps) {
  return (
    <Stack>
      <Text fontWeight="bold">Function Arguments</Text>
      <List.Root gap={2}>
        {functionArgs.map((arg) => (
          <List.Item key={arg.hex}>
            <Text>Name: {arg.name}</Text>
            <Text>Type: {arg.type}</Text>
            <Text>Repr: {arg.repr}</Text>
          </List.Item>
        ))}
      </List.Root>
    </Stack>
  );
}

function DecodedFunctionArgs({ tx }: { tx: Transaction }) {
  let decoded;
  try {
    decoded = decodeTxArgs(tx);
  } catch (error) {
    return <Text>Failed to decode arguments: {error instanceof Error ? error.toString() : `Unknown error: ${String(error)}`}</Text>;
  }

  if (!decoded) {
    return <Text>No decodable arguments.</Text>;
  }

  let decodedType = 'Unknown';
  let gridItems: { label: string; value: string }[] = [];

  if (isValidMiningTxArgs(decoded)) {
    decodedType = 'Mining';
    gridItems = [
      { label: 'Amounts uSTX', value: decoded.amountsUstx.map(a => a.toString()).join(', ') },
    ];
  } else if (isValidStackingTxArgs(decoded)) {
    decodedType = 'Stacking';
    gridItems = [
      { label: 'Amount Token', value: decoded.amountToken.toString() },
      { label: 'Lock Period', value: decoded.lockPeriod.toString() },
    ];
  } else if (isValidMiningClaimTxArgs(decoded)) {
    decodedType = 'Mining Claim';
    gridItems = [
      { label: 'Miner Block Height', value: decoded.minerBlockHeight.toString() },
    ];
  } else if (isValidStackingClaimTxArgs(decoded)) {
    decodedType = 'Stacking Claim';
    gridItems = [
      { label: 'Reward Cycle', value: decoded.rewardCycle.toString() },
    ];
  }

  return (
    <Stack>
      <Text fontWeight="bold">Decoded Arguments ({decodedType})</Text>
      <Grid templateColumns="1fr 1fr" gap={2}>
        {gridItems.map((item, index) => (
          <Fragment key={index}>
            <Text>{item.label}:</Text>
            <Text>{item.value}</Text>
          </Fragment>
        ))}
      </Grid>
    </Stack>
  );
}

function TransactionDetailsDialog({
  tx,
  isOpen,
  onClose,
}: TransactionDetailsDialogProps) {
  if (!tx) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} size="full">
      <Dialog.Backdrop />
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Transaction Details</Dialog.Title>
          <Dialog.CloseTrigger />
        </Dialog.Header>
        <Dialog.Body>
          <Stack gap={4}>
            <Grid templateColumns="1fr 3fr" gap={2}>
              <Text fontWeight="bold">TXID:</Text>
              <Link href={`https://explorer.hiro.so/tx/${tx.tx_id}`} rel="noopener noreferrer" target="_blank">
                {tx.tx_id}
              </Link>
              <Text fontWeight="bold">Status:</Text>
              <Badge colorScheme={tx.tx_status === 'success' ? 'green' : 'red'}>
                {tx.tx_status}
              </Badge>
              <Text fontWeight="bold">Block Height:</Text>
              <Link href={`https://explorer.hiro.so/block/${tx.block_height}`} rel="noopener noreferrer" target="_blank">
                {tx.block_height}
              </Link>
              <Text fontWeight="bold">Block Time:</Text>
              <Text>{formatDate(tx.block_time_iso)}</Text>
              <Text fontWeight="bold">Sender Address:</Text>
              <Text>{shortenPrincipal(tx.sender_address)}</Text>
              <Text fontWeight="bold">Fee:</Text>
              <Text>{formatMicroAmount(parseFloat(tx.fee_rate))} STX</Text>
            </Grid>
            {tx.tx_type === "contract_call" && (
              <Stack gap={2}>
                <Text fontWeight="bold" fontSize="lg">Contract Call Details</Text>
                <Grid templateColumns="1fr 3fr" gap={2}>
                  <Text fontWeight="bold">Contract ID:</Text>
                  <Text>{shortenPrincipal(tx.contract_call.contract_id)}</Text>
                  <Text fontWeight="bold">Function Name:</Text>
                  <Text>{tx.contract_call.function_name}</Text>
                </Grid>
                {tx.contract_call.function_args && (
                  <TransactionFunctionArgs
                    functionArgs={tx.contract_call.function_args}
                  />
                )}
                <DecodedFunctionArgs tx={tx} />
              </Stack>
            )}
          </Stack>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default TransactionList;
