import {
  Stack,
  Text,
  List,
  ListItem,
  Spinner,
  Box,
  IconButton,
  Drawer,
  Portal,
  CloseButton,
  useDisclosure,
  Button,
  Grid,
} from "@chakra-ui/react";
import { IoMdRefresh } from "react-icons/io";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { transactionFetchStatusAtom, transactionsAtom } from "../store/stacks";
import { formatDate } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { selectedTransactionsAtom } from "../store/citycoins";
import { Fragment, useState } from "react";
import { decodeTxArgs, isValidMiningTxArgs, isValidStackingTxArgs, isValidMiningClaimTxArgs, isValidStackingClaimTxArgs } from "../utilities/transactions";

interface TransactionListProps {
  transactions: Transaction[];
}

interface TransactionItemProps {
  tx: Transaction;
  onOpenDetails: (tx: Transaction) => void;
}

interface TransactionFunctionArgsProps {
  functionArgs: {
    hex: string;
    repr: string;
    name: string;
    type: string;
  }[];
}

interface TransactionDetailsDrawerProps {
  tx: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

function TransactionList({ transactions }: TransactionListProps) {
  const [allTransactions, updateTransactions] = useAtom(transactionsAtom);
  const { isLoading, error, progress } = useAtomValue(
    transactionFetchStatusAtom
  );

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
  const summaries = transactions.reduce(
    (acc, tx) => {
      if (tx.tx_type === "contract_call") {
        const func = tx.contract_call.function_name;
        if (["mine-tokens", "mine-many", "mine"].includes(func)) {
          acc.mining++;
        } else if (func === "claim-mining-reward") {
          acc.miningClaims++;
        } else if (["stack-tokens", "stack"].includes(func)) {
          acc.stacking++;
        } else if (func === "claim-stacking-reward") {
          acc.stackingClaims++;
        } else if (func === "transfer") {
          acc.transfers++;
        }
      }
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
                ? `Filtered transactions: ${transactions.length} / ${allTransactions.length}`
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
      <Stack direction="row" gap={4}>
        <Text>Mining: {summaries.mining}</Text>
        <Text>Mining Claims: {summaries.miningClaims}</Text>
        <Text>Stacking: {summaries.stacking}</Text>
        <Text>Stacking Claims: {summaries.stackingClaims}</Text>
        <Text>Transfers: {summaries.transfers}</Text>
      </Stack>
      <Stack>
        {transactions?.length === 0 && <Text>No transactions found.</Text>}
        {transactions?.length > 0 && (
          <List.Root>
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.tx_id}
                tx={tx}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </List.Root>
        )}
      </Stack>
      <TransactionDetailsDrawer
        tx={selectedTx}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Stack>
  );
}

function TransactionItem({ tx, onOpenDetails }: TransactionItemProps) {
  let category = "Other";
  if (tx.tx_type === "contract_call") {
    const func = tx.contract_call.function_name;
    if (["mine-tokens", "mine-many", "mine"].includes(func)) {
      category = "Mining";
    } else if (func === "claim-mining-reward") {
      category = "Mining Claim";
    } else if (["stack-tokens", "stack"].includes(func)) {
      category = "Stacking";
    } else if (func === "claim-stacking-reward") {
      category = "Stacking Claim";
    } else if (func === "transfer") {
      category = "Transfer";
    }
  }

  return (
    <ListItem borderWidth="1px" borderRadius="lg" p={4} mb={2}>
      <Grid templateColumns="2fr 2fr 1fr 3fr 2fr" gap={4} alignItems="center">
        <Text>
          {tx.tx_id.slice(0, 6)}...{tx.tx_id.slice(-4)}
        </Text>
        <Text>{category}</Text>
        <Text>{tx.tx_status === "success" ? "✅" : "❌"}</Text>
        <Text>{formatDate(tx.block_time_iso)}</Text>
        <Button size="sm" onClick={() => onOpenDetails(tx)}>
          Details
        </Button>
      </Grid>
    </ListItem>
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
          <ListItem key={arg.hex}>
            <Text>Name: {arg.name}</Text>
            <Text>Type: {arg.type}</Text>
            <Text>Repr: {arg.repr}</Text>
          </ListItem>
        ))}
      </List.Root>
    </Stack>
  );
}

function DecodedFunctionArgs({ tx }: { tx: Transaction }) {
  let decoded;
  try {
    decoded = decodeTxArgs(tx);
    console.log("Final decoded for tx " + tx.tx_id + ":", decoded);
  } catch (error) {
    return <Text>Failed to decode arguments: {error instanceof Error ? error.toString() : `Unknown error: ${String(error)}`}</Text>;
  }

  if (!decoded) {
    return <Text>No decodable arguments.</Text>;
  }

  let decodedType = 'Unknown';
  let gridItems: { label: string; value: string }[] = [];

  console.log("Decoded:", decoded);
  console.log("typeof rewardCycle:", typeof decoded.rewardCycle);
  console.log("rewardCycle value:", decoded.rewardCycle);
  console.log("functionName:", decoded.functionName);

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
    console.log("Matched stacking claim");
    decodedType = 'Stacking Claim';
    gridItems = [
      { label: 'Reward Cycle', value: decoded.rewardCycle.toString() },
    ];
  } else {
    console.log("Type guards did not match");
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

function TransactionDetailsDrawer({
  tx,
  isOpen,
  onClose,
}: TransactionDetailsDrawerProps) {
  if (!tx) return null;

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="bottom"
      size="lg"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Transaction Details</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap={2}>
                <Text fontWeight="bold" fontSize="lg">
                  TXID: {tx.tx_id}
                </Text>
                <Text>
                  Status:{" "}
                  {tx.tx_status === "success" ? "✅ Success" : "❌ Failed"}
                </Text>
                <Text>Block Height: {tx.block_height}</Text>
                <Text>Block Time: {formatDate(tx.block_time_iso)}</Text>
                <Text>Sender Address: {tx.sender_address}</Text>
                <Text>Fee Rate: {tx.fee_rate}</Text>
                {tx.tx_type === "contract_call" && (
                  <>
                    <Text fontWeight="bold">Contract Call Details</Text>
                    <Text>Contract ID: {tx.contract_call.contract_id}</Text>
                    <Text>Function Name: {tx.contract_call.function_name}</Text>

                    {tx.contract_call.function_args && (
                      <TransactionFunctionArgs
                        functionArgs={tx.contract_call.function_args}
                      />
                    )}
                    <DecodedFunctionArgs tx={tx} />
                  </>
                )}
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export default TransactionList;
