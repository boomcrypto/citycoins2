import { Stack, Text, List, ListItem, Spinner, Box } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { acctTxsAtom } from "../store/stacks";
import { useFetchTransactions } from "../hooks/use-fetch-transactions";
import { formatDate } from "../store/common";

function TransactionList() {
  const transactions = useAtomValue(acctTxsAtom);
  const { progress, isLoading, error } = useFetchTransactions();

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center">
          <Box
            w={3}
            h={3}
            borderRadius="50%"
            bg={isLoading ? "yellow.500" : error ? "red.500" : "green.500"}
          />
          {isLoading && (
            <Stack direction="row" align="center">
              <Spinner />
              <Text>Loading transactions... {progress.toFixed(2)}%</Text>
            </Stack>
          )}
          {error && <Text color="red.500">Error: {error}</Text>}
          {!isLoading && !error && (
            <Text>Transactions loaded successfully.</Text>
          )}
        </Stack>
        <Stack>
          {transactions?.length === 0 && <Text>No transactions found.</Text>}
          {transactions?.length > 0 && (
            <Text>{JSON.stringify(transactions)}</Text>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default TransactionList;
