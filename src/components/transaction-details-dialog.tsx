import { Stack, Text, Grid, Link, Badge, List, Dialog, Portal } from "@chakra-ui/react";
import { Fragment } from "react";
import { formatDate, formatMicroAmount } from "../store/common";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
} from "../utilities/transactions";

interface TransactionDetailsDialogProps {
  tx: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

function shortenPrincipal(addr: string): string {
  return addr ? `${addr.slice(0, 5)}...${addr.slice(-5)}` : "";
}

function TransactionFunctionArgs({
  functionArgs,
}: {
  functionArgs: {
    hex: string;
    repr: string;
    name: string;
    type: string;
  }[];
}) {
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
    return (
      <Text>
        Failed to decode arguments:{" "}
        {error instanceof Error
          ? error.toString()
          : `Unknown error: ${String(error)}`}
      </Text>
    );
  }

  if (!decoded) {
    return <Text>No decodable arguments.</Text>;
  }

  let decodedType = "Unknown";
  let gridItems: { label: string; value: string }[] = [];

  if (isValidMiningTxArgs(decoded)) {
    decodedType = "Mining";
    gridItems = [
      {
        label: "Amounts uSTX",
        value: decoded.amountsUstx.map((a) => a.toString()).join(", "),
      },
    ];
  } else if (isValidStackingTxArgs(decoded)) {
    decodedType = "Stacking";
    gridItems = [
      { label: "Amount Token", value: decoded.amountToken.toString() },
      { label: "Lock Period", value: decoded.lockPeriod.toString() },
    ];
  } else if (isValidMiningClaimTxArgs(decoded)) {
    decodedType = "Mining Claim";
    gridItems = [
      {
        label: "Miner Block Height",
        value: decoded.minerBlockHeight.toString(),
      },
    ];
  } else if (isValidStackingClaimTxArgs(decoded)) {
    decodedType = "Stacking Claim";
    gridItems = [
      { label: "Reward Cycle", value: decoded.rewardCycle.toString() },
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
    <Portal>
      <Dialog.Root open={isOpen} onOpenChange={onClose} size="xl" placement="center">
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Transaction Details</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body overflow="auto">
            <Stack gap={4}>
              <Grid templateColumns="1fr 3fr" gap={2}>
                <Text fontWeight="bold">TXID:</Text>
                <Link
                  href={`https://explorer.hiro.so/tx/${tx.tx_id}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {tx.tx_id}
                </Link>
                <Text fontWeight="bold">Status:</Text>
                <Badge colorScheme={tx.tx_status === "success" ? "green" : "red"}>
                  {tx.tx_status}
                </Badge>
                <Text fontWeight="bold">Block Height:</Text>
                <Link
                  href={`https://explorer.hiro.so/block/${tx.block_height}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
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
                  <Text fontWeight="bold" fontSize="lg">
                    Contract Call Details
                  </Text>
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
    </Portal>
  );
}

export default TransactionDetailsDialog;
