import {
  Stack,
  Text,
  Grid,
  Link,
  Badge,
  List,
  Dialog,
  Portal,
  Box,
  Heading,
  Separator,
} from "@chakra-ui/react";
import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { ClarityValue, deserializeCV } from "@stacks/transactions";
import { formatDate, formatMicroAmount } from "../store/common";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
  isValidTransferTxArgs,
} from "../utilities/transactions";
import { minedBlocksAtom } from "../store/stacks";
import { decodeClarityValues, shortenPrincipal } from "../utilities/clarity";

interface TransactionDetailsDialogProps {
  tx: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

function TransactionArguments({ tx }: { tx: Transaction }) {
  const minedBlocks = useAtomValue(minedBlocksAtom);

  let decoded;
  let decodeError = false;
  try {
    decoded = decodeTxArgs(tx);
  } catch (error) {
    console.warn(`Decode error for tx ${tx.tx_id}:`, error);
    decodeError = true;
  }

  if (decodeError || !decoded) {
    // If decoding fails, show raw arguments
    return (
      <Box>
        <Heading size="md" mb={3}>
          Function Arguments (Decode Failed - Raw)
        </Heading>
        <Text mb={2} color="orange.600">Decode failed—raw args below.</Text>
        <List.Root gap={3}>
          {tx.tx_type === "contract_call" &&
            tx.contract_call.function_args &&
            tx.contract_call.function_args.map((arg, index) => (
              <List.Item key={arg.hex} p={3} bg="gray.50" borderRadius="md">
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Argument {index + 1}
                  </Text>
                  <Text>
                    <strong>Name:</strong> {arg.name}
                  </Text>
                  <Text>
                    <strong>Type:</strong> {arg.type}
                  </Text>
                  <Text>
                    <strong>Repr:</strong> {arg.repr}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    <strong>Hex:</strong> {arg.hex}
                  </Text>
                </Stack>
              </List.Item>
            ))}
        </List.Root>
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
        value: decoded.amountsUstx
          .map((a) => formatMicroAmount(Number(a), 6, 6))
          .join(", "),
      },
      {
        label: "Mined Blocks",
        value: minedBlocks.get(tx.tx_id)?.join(", ") || "N/A",
      },
    ];
  } else if (isValidStackingTxArgs(decoded)) {
    decodedType = "Stacking";
    gridItems = [
      {
        label: "Amount Token",
        value: formatMicroAmount(Number(decoded.amountToken)),
      },
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
  } else if (isValidTransferTxArgs(decoded)) {
    decodedType = "Transfer";
    gridItems = [
      { label: "Amount", value: formatMicroAmount(Number(decoded.amount)) },
      { label: "Recipient", value: shortenPrincipal(decoded.recipient) },
      ...(decoded.memo ? [{ label: "Memo", value: decoded.memo }] : []),
    ];
  }

  return (
    <Box>
      <Heading size="md" mb={3}>
        Decoded Arguments ({decodedType})
      </Heading>
      <Grid templateColumns="1fr 2fr" gap={4}>
        {gridItems.map((item, index) => (
          <Fragment key={index}>
            <Text fontWeight="bold" color="gray.700">
              {item.label}:
            </Text>
            <Text>{item.value}</Text>
          </Fragment>
        ))}
      </Grid>
    </Box>
  );
}

function getTokenDecimals(assetId: string | undefined): number {
  if (!assetId) return 6; // STX
  if (assetId.includes("-v2")) return 6; // v2 tokens
  return 0; // v1 tokens and others
}

function getDisplayDecimals(assetId: string | undefined): number {
  return assetId ? 0 : 6; // 0 for tokens, 6 for STX
}

function formatEventAmount(
  assetId: string | undefined,
  amount: string | undefined
): string {
  if (!amount) return "0";
  const decimals = getTokenDecimals(assetId);
  const displayDecimals = getDisplayDecimals(assetId);
  const tokenName = assetId ? assetId.split("::")[1] : "STX";
  return `${formatMicroAmount(
    Number(amount),
    decimals,
    displayDecimals
  )} ${tokenName}`;
}

function TransactionEvents({ tx }: { tx: Transaction }) {
  if (!tx.events || tx.events.length === 0) return null;

  return (
    <Box>
      <Heading size="md" mb={3}>
        Transaction Events
      </Heading>
      <List.Root gap={3}>
        {tx.events.map((event, index) => {
          let content;
          switch (event.event_type) {
            case "stx_asset":
              switch (event.asset.asset_event_type) {
                case "transfer":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">STX Transfer</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(undefined, event.asset.amount)}
                      </Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "mint":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">STX Mint</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(undefined, event.asset.amount)}
                      </Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "burn":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">STX Burn</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(undefined, event.asset.amount)}
                      </Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                    </Stack>
                  );
                  break;
              }
              break;
            case "fungible_token_asset":
              switch (event.asset.asset_event_type) {
                case "transfer":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">FT Transfer</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(
                          event.asset.asset_id,
                          event.asset.amount
                        )}
                      </Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "mint":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">FT Mint</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(
                          event.asset.asset_id,
                          event.asset.amount
                        )}
                      </Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "burn":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">FT Burn</Text>
                      <Text>
                        Amount:{" "}
                        {formatEventAmount(
                          event.asset.asset_id,
                          event.asset.amount
                        )}
                      </Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                    </Stack>
                  );
                  break;
              }
              break;
            case "non_fungible_token_asset":
              switch (event.asset.asset_event_type) {
                case "transfer":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">NFT Transfer</Text>
                      <Text>Asset: {event.asset.asset_id}</Text>
                      <Text>Value: {event.asset.value.repr}</Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "mint":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">NFT Mint</Text>
                      <Text>Asset: {event.asset.asset_id}</Text>
                      <Text>Value: {event.asset.value.repr}</Text>
                      <Text>
                        To: {shortenPrincipal(event.asset.recipient!)}
                      </Text>
                    </Stack>
                  );
                  break;
                case "burn":
                  content = (
                    <Stack gap={1}>
                      <Text fontWeight="bold">NFT Burn</Text>
                      <Text>Asset: {event.asset.asset_id}</Text>
                      <Text>Value: {event.asset.value.repr}</Text>
                      <Text>From: {shortenPrincipal(event.asset.sender!)}</Text>
                    </Stack>
                  );
                  break;
              }
              break;
            case "smart_contract_log":
              let decodedPrint: any;
              let printError = false;
              try {
                const cv: ClarityValue = deserializeCV(
                  event.contract_log.value.hex
                );
                decodedPrint = decodeClarityValues(cv);
              } catch (e) {
                console.warn(`Print decode error for event in tx ${tx.tx_id}:`, e);
                decodedPrint = event.contract_log.value.repr;
                printError = true;
              }
              content = (
                <Stack gap={1}>
                  <Text fontWeight="bold">Contract Log (Print Event)</Text>
                  <Text>
                    Contract: {shortenPrincipal(event.contract_log.contract_id)}
                  </Text>
                  {printError && <Text color="orange.600" fontSize="sm">Raw print—decode failed.</Text>}
                  <Box
                    bg="gray.100"
                    p={2}
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {JSON.stringify(decodedPrint, null, 2)}
                  </Box>
                </Stack>
              );
              break;
            default:
              content = (
                <Stack gap={1}>
                  <Text fontWeight="bold">Unknown Event</Text>
                  <Text>Type: {event.event_type}</Text>
                  <Text>Raw: {JSON.stringify(event, null, 2)}</Text>
                </Stack>
              );
          }
          return (
            <List.Item key={index} p={3} bg="gray.50" borderRadius="md">
              {content}
            </List.Item>
          );
        })}
      </List.Root>
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
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Transaction Details</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body overflowY="auto" p={6}>
              <Stack gap={6}>
                {/* Transaction Metadata */}
                <Box>
                  <Heading size="md" mb={4}>
                    Transaction Information
                  </Heading>
                  <Grid templateColumns="1fr 2fr" gap={4}>
                    <Text fontWeight="bold" color="gray.700">
                      TXID:
                    </Text>
                    <Link
                      href={`https://explorer.hiro.so/tx/${tx.tx_id}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      color="blue.500"
                      fontWeight="medium"
                    >
                      {tx.tx_id}
                    </Link>
                    <Text fontWeight="bold" color="gray.700">
                      Status:
                    </Text>
                    <Badge
                      colorScheme={tx.tx_status === "success" ? "green" : "red"}
                      variant="solid"
                    >
                      {tx.tx_status}
                    </Badge>
                    <Text fontWeight="bold" color="gray.700">
                      Block Height:
                    </Text>
                    <Link
                      href={`https://explorer.hiro.so/block/${tx.block_height}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      color="blue.500"
                      fontWeight="medium"
                    >
                      {tx.block_height}
                    </Link>
                    <Text fontWeight="bold" color="gray.700">
                      Block Time:
                    </Text>
                    <Text>{formatDate(tx.block_time_iso)}</Text>
                    <Text fontWeight="bold" color="gray.700">
                      Sender Address:
                    </Text>
                    <Link
                      href={`https://explorer.hiro.so/address/${tx.sender_address}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      color="blue.500"
                      fontWeight="medium"
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      {shortenPrincipal(tx.sender_address)}
                    </Link>
                    <Text fontWeight="bold" color="gray.700">
                      Fee:
                    </Text>
                    <Text>
                      {formatMicroAmount(parseFloat(tx.fee_rate), 6, 6)} STX
                    </Text>
                  </Grid>
                </Box>

                <Separator />

                {/* Contract Call Details */}
                {tx.tx_type === "contract_call" && (
                  <Box>
                    <Heading size="md" mb={4}>
                      Contract Call Details
                    </Heading>
                    <Grid templateColumns="1fr 2fr" gap={4} mb={4}>
                      <Text fontWeight="bold" color="gray.700">
                        Contract ID:
                      </Text>
                      <Link
                        href={`https://explorer.hiro.so/contract/${tx.contract_call.contract_id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                        color="blue.500"
                        fontWeight="medium"
                        fontFamily="mono"
                        fontSize="sm"
                      >
                        {shortenPrincipal(tx.contract_call.contract_id)}
                      </Link>
                      <Text fontWeight="bold" color="gray.700">
                        Function Name:
                      </Text>
                      <Text fontWeight="medium">
                        {tx.contract_call.function_name}
                      </Text>
                    </Grid>
                    {tx.contract_call.function_args &&
                      tx.contract_call.function_args.length > 0 && (
                        <TransactionArguments tx={tx} />
                      )}
                  </Box>
                )}
                {tx.events && tx.events.length > 0 && (
                  <>
                    <Separator />
                    <TransactionEvents tx={tx} />
                  </>
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
