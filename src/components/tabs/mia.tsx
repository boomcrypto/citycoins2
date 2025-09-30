import {
  Accordion,
  Badge,
  Box,
  Button,
  Heading,
  Link,
  Spinner,
  Stack,
  Table,
  Text,
  Tooltip,
  TooltipRoot,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { openContractCall } from "@stacks/connect";
import {
  ContractCallTransaction,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import SignIn from "../auth/sign-in";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import { shortenPrincipal, shortenTxId } from "../../utilities/clarity";
import { buildCityTxFilter } from "../../utilities/contracts";
import TransactionList from "../transaction-list";
import { useCityHistory, HistoryEntry } from "../../hooks/useCityHistory";
import { findEntry, REGISTRY } from "../../utilities/contracts";
import { uintCV, stringAsciiCV } from "@stacks/transactions";
import {
  miaBalancesAtom,
  miaEligibilityAtom,
  miaFormattedBalancesAtom,
  useCheckCityEligibility,
  useResetCityEligibility,
  CITY_INFO,
} from "../../store/city-balances";
import { getCityConfig } from "../../config/city-config";

interface MiaProps {
  onOpenDetails: (tx: Transaction) => void;
}

function Mia({ onOpenDetails }: MiaProps) {
  const stxAddress = useAtomValue(stxAddressAtom);

  const balances = useAtomValue(miaBalancesAtom);
  const eligibility = useAtomValue(miaEligibilityAtom);
  const formattedBalances = useAtomValue(miaFormattedBalancesAtom);
  const checkEligibility = useCheckCityEligibility('mia');
  const resetEligibility = useResetCityEligibility('mia');

  const MIA_TX_FILTER = buildCityTxFilter("mia");

  const transactions = useAtomValue(transactionsAtom);
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.tx_type !== "contract_call") return false;
      const contractId = tx.contract_call.contract_id;
      const func = tx.contract_call.function_name;
      return MIA_TX_FILTER.some(
        (filter) =>
          filter.contract === contractId && filter.functions.includes(func)
      );
    }) as ContractCallTransaction[];
  }, [transactions, MIA_TX_FILTER]);

  const { miningHistory, isMiningLoading, stackingHistory, isStackingLoading } =
    useCityHistory(filteredTransactions, stxAddress);

  // Reset eligibility on address change (e.g., sign-out)
  useEffect(() => {
    if (!stxAddress) resetEligibility();
  }, [stxAddress, resetEligibility]);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">MIA Tools</Heading>
        <Text>
          Wallet connection required to access tools and utilities for MiamiCoin
          (MIA).
        </Text>
        <SignIn />
      </Stack>
    );
  }

  const config = getCityConfig('mia');
  const redemptionConfig = config.redemption;
  const MIA_REDEMPTION_CONTRACT = `${redemptionConfig.deployer}.${redemptionConfig.contractName}`;

  const checkEligibilityHandler = async () => {
    console.log("Pending CCIP-026 vote and approval...");
    // return; // Uncomment when ready
    await checkEligibility();
  };

  const executeRedemption = async () => {
    console.log("Executing redemption...");
    const [address, name] = MIA_REDEMPTION_CONTRACT.split(".");
    try {
      openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: "redeem-mia",
        functionArgs: [],
        postConditionMode: 0x02, // allow
        onFinish: (data) => {
          console.log("Redemption transaction finished:", data);
        },
        onCancel: () => {
          console.log("Redemption transaction cancelled");
        },
      });
    } catch (error) {
      console.error("Error executing redemption:", error);
    }
  };

  const handleClaimMining = (entry: HistoryEntry) => {
    if (entry.status !== "unclaimed" || !stxAddress) {
      console.warn("Invalid claim: status or address invalid");
      return;
    }
    const contractEntry = findEntry(entry.contractId, entry.functionName);
    if (!contractEntry) {
      console.warn("Invalid claim: missing contract entry");
      return;
    }

    const [address, name] = entry.contractId.split(".");
    let functionName = "claim-mining-reward";
    let functionArgs: any[] = [];

    if (contractEntry.module === "core") {
      functionArgs = [uintCV(entry.id)];
    } else if (contractEntry.module === "mining") {
      const cityName =
        contractEntry.city === "mia"
          ? stringAsciiCV("MIA")
          : stringAsciiCV("NYC");
      functionArgs = [cityName, uintCV(entry.id)];
    } else {
      console.warn("Invalid claim: unsupported module for mining");
      return;
    }

    openContractCall({
      contractAddress: address,
      contractName: name,
      functionName,
      functionArgs,
      postConditionMode: 0x02,
      onFinish: (data) => console.log("Mining claim finished:", data),
      onCancel: () => console.log("Mining claim cancelled"),
    });
  };

  const handleClaimStacking = (entry: HistoryEntry) => {
    if (entry.status !== "unclaimed" || !stxAddress) {
      console.warn("Invalid claim: status or address invalid");
      return;
    }
    const contractEntry = findEntry(entry.contractId, entry.functionName);
    if (!contractEntry) {
      console.warn("Invalid claim: missing contract entry");
      return;
    }

    const [address, name] = entry.contractId.split(".");
    let functionName = "claim-stacking-reward";
    let functionArgs: any[] = [];

    if (contractEntry.module === "core") {
      functionArgs = [uintCV(entry.id)];
    } else if (contractEntry.module === "stacking") {
      const cityName =
        contractEntry.city === "mia"
          ? stringAsciiCV("MIA")
          : stringAsciiCV("NYC");
      functionArgs = [cityName, uintCV(entry.id)];
    } else {
      console.warn("Invalid claim: unsupported module for stacking");
      return;
    }

    openContractCall({
      contractAddress: address,
      contractName: name,
      functionName,
      functionArgs,
      postConditionMode: 0x02,
      onFinish: (data) => console.log("Stacking claim finished:", data),
      onCancel: () => console.log("Stacking claim cancelled"),
    });
  };

  return (
    <Stack gap={4}>
      <Heading size="4xl">MIA Tools</Heading>
      <Text>Access tools and utilities for MiamiCoin (MIA) below.</Text>
      <Accordion.Root collapsible defaultValue={["redeem-mia"]}>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem MIA</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Text mb={4}>
              Burn MIA to receive STX per{" "}
              <Link
                href="https://github.com/citycoins/governance/pull/50"
                rel="noopener noreferrer"
                target="_blank"
              >
                CCIP-026
              </Link>
              .{" "}
              <Text as="span" color="gray.500">
                Pending approval.
              </Text>
            </Text>
            <Stack direction="row" gap={4}>
              <TooltipRoot content="Pending CCIP-026 approval">
                <Button
                  variant="outline"
                  onClick={checkEligibilityHandler}
                  isLoading={eligibility.isLoading}
                  disabled={true}
                >
                  Check Eligibility
                </Button>
              </TooltipRoot>
              <Button
                variant="outline"
                onClick={executeRedemption}
                disabled={!eligibility.hasChecked || !eligibility.isEligible || eligibility.isLoading}
              >
                Execute Redemption
              </Button>
            </Stack>
            {eligibility.hasChecked && (
              <Stack mt={4}>
                <Text>MIA v1 Balance: {balances.v1}</Text>
                <Text>MIA v2 Balance: {formattedBalances.v2}</Text>
                <Text>
                  {eligibility.isEligible
                    ? "You are eligible for redemption."
                    : "You are not eligible for redemption."}
                </Text>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Mining History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            {isMiningLoading ? (
              <Stack align="center">
                <Spinner size="sm" />
                <Text>Loading mining history...</Text>
              </Stack>
            ) : (
              <Stack gap={4}>
                <Stack direction="row" gap={4} flexWrap="wrap">
                  <Badge variant="outline">
                    Total Mined Blocks: {miningHistory.length}
                  </Badge>
                  <Badge colorScheme="green" variant="outline">
                    Claimed:{" "}
                    {miningHistory.filter((h) => h.status === "claimed").length}
                  </Badge>
                  <Badge colorScheme="red" variant="outline">
                    Unclaimed:{" "}
                    {
                      miningHistory.filter((h) => h.status === "unclaimed")
                        .length
                    }
                  </Badge>
                </Stack>
                {miningHistory.length === 0 ? (
                  <Text>No mining history found.</Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root variant="outline">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Block</Table.ColumnHeader>
                          <Table.ColumnHeader>Mining TX</Table.ColumnHeader>
                          <Table.ColumnHeader>Contract</Table.ColumnHeader>
                          <Table.ColumnHeader>Function</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>Claim TX</Table.ColumnHeader>
                          <Table.ColumnHeader>Action</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {miningHistory.map((entry) => (
                          <Table.Row key={entry.id}>
                            <Table.Cell>{entry.id}</Table.Cell>
                            <Table.Cell>
                              <Link
                                href={`https://explorer.hiro.so/tx/${entry.txId}`}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                {shortenTxId(entry.txId)}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>
                              {shortenPrincipal(entry.contractId)}
                            </Table.Cell>
                            <Table.Cell>{entry.functionName}</Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorScheme={
                                  entry.status === "claimed" ? "green" : "red"
                                }
                              >
                                {entry.status.charAt(0).toUpperCase() +
                                  entry.status.slice(1)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              {entry.claimTxId ? (
                                <Link
                                  href={`https://explorer.hiro.so/tx/${entry.claimTxId}`}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {shortenTxId(entry.claimTxId)}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === "unclaimed" && entry.entry && (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimMining(entry)}
                                >
                                  Claim
                                </Button>
                              )}
                              {entry.status === "unknown" && (
                                <TooltipRoot content="Check failed—view details or retry">
                                  <Badge colorScheme="gray">Unknown</Badge>
                                </TooltipRoot>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Stacking History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            {isStackingLoading ? (
              <Stack align="center">
                <Spinner size="sm" />
                <Text>Loading stacking history...</Text>
              </Stack>
            ) : (
              <Stack gap={4}>
                <Stack direction="row" gap={4} flexWrap="wrap">
                  <Badge variant="outline">
                    Total Stacked Cycles: {stackingHistory.length}
                  </Badge>
                  <Badge colorScheme="green" variant="outline">
                    Claimed:{" "}
                    {
                      stackingHistory.filter((h) => h.status === "claimed")
                        .length
                    }
                  </Badge>
                  <Badge colorScheme="red" variant="outline">
                    Unclaimed:{" "}
                    {
                      stackingHistory.filter((h) => h.status === "unclaimed")
                        .length
                    }
                  </Badge>
                </Stack>
                {stackingHistory.length === 0 ? (
                  <Text>No stacking history found.</Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root variant="outline">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Cycle</Table.ColumnHeader>
                          <Table.ColumnHeader>Stacking TX</Table.ColumnHeader>
                          <Table.ColumnHeader>Contract</Table.ColumnHeader>
                          <Table.ColumnHeader>Function</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>Claim TX</Table.ColumnHeader>
                          <Table.ColumnHeader>Action</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {stackingHistory.map((entry) => (
                          <Table.Row key={entry.id}>
                            <Table.Cell>{entry.id}</Table.Cell>
                            <Table.Cell>
                              <Link
                                href={`https://explorer.hiro.so/tx/${entry.txId}`}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                {shortenTxId(entry.txId)}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>
                              {shortenPrincipal(entry.contractId)}
                            </Table.Cell>
                            <Table.Cell>{entry.functionName}</Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorScheme={
                                  entry.status === "claimed" ? "green" : "red"
                                }
                              >
                                {entry.status.charAt(0).toUpperCase() +
                                  entry.status.slice(1)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              {entry.claimTxId ? (
                                <Link
                                  href={`https://explorer.hiro.so/tx/${entry.claimTxId}`}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {shortenTxId(entry.claimTxId)}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === "unclaimed" && entry.entry && (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimStacking(entry)}
                                >
                                  Claim
                                </Button>
                              )}
                              {entry.status === "unknown" && (
                                <TooltipRoot content="Check failed—view details or retry">
                                  <Badge colorScheme="gray">Unknown</Badge>
                                </TooltipRoot>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Transactions</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <TransactionList
              transactions={filteredTransactions}
              onOpenDetails={onOpenDetails}
            />
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Mia;
