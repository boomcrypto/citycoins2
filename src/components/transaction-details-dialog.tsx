import { Stack, Text, Grid, Link, Badge, List, Dialog, Portal, Box, Heading, Separator } from "@chakra-ui/react";
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
  if (!addr) return "";
  if (addr.includes(".")) {
    const [address, contract] = addr.split(".");
    return `${address.slice(0, 5)}...${address.slice(-5)}.${contract}`;
  }
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
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
    <Box>
      <Heading size="md" mb={3}>Function Arguments</Heading>
      <List.Root gap={3}>
        {functionArgs.map((arg, index) => (
          <List.Item key={arg.hex} p={3} bg="gray.50" borderRadius="md">
            <Stack gap={1}>
              <Text fontWeight="bold" fontSize="sm" color="gray.600">Argument {index + 1}</Text>
              <Text><strong>Name:</strong> {arg.name}</Text>
              <Text><strong>Type:</strong> {arg.type}</Text>
              <Text><strong>Repr:</strong> {arg.repr}</Text>
              <Text fontSize="xs" color="gray.500"><strong>Hex:</strong> {arg.hex}</Text>
            </Stack>
          </List.Item>
        ))}
      </List.Root>
    </Box>
  );
}

function DecodedFunctionArgs({ tx }: { tx: Transaction }) {
  let decoded;
  try {
    decoded = decodeTxArgs(tx);
  } catch (error) {
    return (
      <Box p={3} bg="red.50" borderRadius="md">
        <Text color="red.600">
          Failed to decode arguments: {error instanceof Error ? error.message : `Unknown error: ${String(error)}`}
        </Text>
      </Box>
    );
  }

  if (!decoded) {
    return (
      <Box p={3} bg="gray.50" borderRadius="md">
        <Text>No decodable arguments.</Text>
      </Box>
    );
  }

  let decodedType = "Unknown";
  let gridItems: { label: string; value: string }[] = [];

  if (isValidMiningTxArgs(decoded)) {
    decodedType = "Mining";
    gridItems = [
      {
        label: "Amounts (uSTX)",
        value: decoded.amountsUstx.map((a) => formatMicroAmount(Number(a))).join(", "),
      },
    ];
  } else if (isValidStackingTxArgs(decoded)) {
    decodedType = "Stacking";
    gridItems = [
      { label: "Amount Token", value: formatMicroAmount(Number(decoded.amountToken)) },
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
    <Box>
      <Heading size="md" mb={3}>Decoded Arguments ({decodedType})</Heading>
      <Grid templateColumns="1fr 2fr" gap={4}>
        {gridItems.map((item, index) => (
          <Fragment key={index}>
            <Text fontWeight="bold" color="gray.700">{item.label}:</Text>
            <Text>{item.value}</Text>
          </Fragment>
        ))}
      </Grid>
    </Box>
  );
}

function TransactionDetailsDialog({
  tx,
  isOpen,
  onClose,
}: TransactionDetailsDialogProps) {
  if (!tx) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} size="xl">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="80vh" overflow="hidden">
            <Dialog.Header>
              <Dialog.Title fontSize="xl" fontWeight="bold">Transaction Details</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body overflowY="auto" p={6}>
              <Stack gap={6}>
                {/* Transaction Metadata */}
                <Box>
                  <Heading size="md" mb={4}>Transaction Information</Heading>
                  <Grid templateColumns="1fr 2fr" gap={4}>
                    <Text fontWeight="bold" color="gray.700">TXID:</Text>
                    <Link
                      href={`https://explorer.hiro.so/tx/${tx.tx_id}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      color="blue.500"
                      fontWeight="medium"
                    >
                      {tx.tx_id}
                    </Link>
                    <Text fontWeight="bold" color="gray.700">Status:</Text>
                    <Badge colorScheme={tx.tx_status === "success" ? "green" : "red"} variant="solid">
                      {tx.tx_status}
                    </Badge>
                    <Text fontWeight="bold" color="gray.700">Block Height:</Text>
                    <Link
                      href={`https://explorer.hiro.so/block/${tx.block_height}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      color="blue.500"
                      fontWeight="medium"
                    >
                      {tx.block_height}
                    </Link>
                    <Text fontWeight="bold" color="gray.700">Block Time:</Text>
                    <Text>{formatDate(tx.block_time_iso)}</Text>
                    <Text fontWeight="bold" color="gray.700">Sender Address:</Text>
                    <Text fontFamily="mono" fontSize="sm">{shortenPrincipal(tx.sender_address)}</Text>
                    <Text fontWeight="bold" color="gray.700">Fee:</Text>
                    <Text>{formatMicroAmount(parseFloat(tx.fee_rate))} STX</Text>
                  </Grid>
                </Box>

                <Separator />

                {/* Contract Call Details */}
                {tx.tx_type === "contract_call" && (
                  <Box>
                    <Heading size="md" mb={4}>Contract Call Details</Heading>
                    <Grid templateColumns="1fr 2fr" gap={4} mb={4}>
                      <Text fontWeight="bold" color="gray.700">Contract ID:</Text>
                      <Text fontFamily="mono" fontSize="sm">{shortenPrincipal(tx.contract_call.contract_id)}</Text>
                      <Text fontWeight="bold" color="gray.700">Function Name:</Text>
                      <Text fontWeight="medium">{tx.contract_call.function_name}</Text>
                    </Grid>
                    {tx.contract_call.function_args && tx.contract_call.function_args.length > 0 && (
                      <>
                        <TransactionFunctionArgs functionArgs={tx.contract_call.function_args} />
                        <Separator my={4} />
                      </>
                    )}
                    <DecodedFunctionArgs tx={tx} />
                  </Box>
                )}
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default TransactionDetailsDialog;
