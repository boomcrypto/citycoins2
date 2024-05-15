import {
  Stack,
  Text,
  List,
  ListItem,
  Spinner,
  Box,
  IconButton,
} from "@chakra-ui/react";
import { IoMdRefresh } from "react-icons/io";
import { useAtom, useAtomValue } from "jotai";
import { transactionFetchStatusAtom, transactionsAtom } from "../store/stacks";
import { formatDate } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { selectedTransactionsAtom } from "../store/citycoins";

interface TransactionListProps {
  transactions: Transaction[];
}

interface TransactionItemProps {
  tx: Transaction;
}

interface TransactionFunctionArgsProps {
  functionArgs: {
    hex: string;
    repr: string;
    name: string;
    type: string;
  }[];
}

function TransactionList({ transactions }: TransactionListProps) {
  const [allTransactions, updateTransactions] = useAtom(transactionsAtom);
  const selectedTransactions = useAtomValue(selectedTransactionsAtom);
  const { isLoading, error, progress } = useAtomValue(
    transactionFetchStatusAtom
  );

  const fetchTransactions = async () => {
    if (isLoading) return;
    try {
      await updateTransactions(allTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Stack spacing={4}>
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
                {transactions?.length > 0
                  ? `Transactions loaded successfully (${selectedTransactions.length})`
                  : "No transactions loaded yet"}
              </Text>
              <IconButton
                icon={<IoMdRefresh />}
                aria-label="Refresh Transactions"
                title="Refresh Transactions"
                size="sm"
                onClick={fetchTransactions}
              />
            </Stack>
          )}
        </Stack>
        <Stack>
          {transactions?.length === 0 && <Text>No transactions found.</Text>}
          {transactions?.length > 0 && (
            <List>
              {transactions.map((tx) => (
                <TransactionItem key={tx.tx_id} tx={tx} />
              ))}
            </List>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function TransactionItem({ tx }: TransactionItemProps) {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mb={4}>
      <Stack spacing={2}>
        <Text fontWeight="bold" fontSize="lg">
          TXID: {tx.tx_id}
        </Text>
        <Text>
          Status: {tx.tx_status === "success" ? "✅ Success" : "❌ Failed"}
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
          </>
        )}
      </Stack>
    </Box>
  );
}

function TransactionFunctionArgs({
  functionArgs,
}: TransactionFunctionArgsProps) {
  return (
    <Stack>
      <Text fontWeight="bold">Function Arguments</Text>
      <List spacing={2}>
        {functionArgs.map((arg) => (
          <ListItem key={arg.hex}>
            <Text>Name: {arg.name}</Text>
            <Text>Type: {arg.type}</Text>
            <Text>Repr: {arg.repr}</Text>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

export default TransactionList;
