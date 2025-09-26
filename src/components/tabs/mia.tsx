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
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { openContractCall } from "@stacks/connect";
import {
  AddressBalanceResponse,
  ContractCallTransaction,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { ClarityType, uintCV } from "@stacks/transactions";
import SignIn from "../auth/sign-in";
import { fancyFetch, HIRO_API } from "../../store/common";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import { shortenPrincipal, shortenTxId } from "../../utilities/clarity";
import { buildCityTxFilter } from "../../utilities/contracts";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
  computeTargetedBlocks,
  computeTargetedCycles,
  fetchCallReadOnlyFunction,
} from "../../utilities/transactions";

interface MiaProps {
  onOpenDetails: (tx: Transaction) => void;
}

interface HistoryEntry {
  id: number;
  txId: string;
  claimTxId?: string;
  status: "claimed" | "unclaimed";
  contractId: string;
  functionName: string;
}

function Mia({ onOpenDetails }: MiaProps) {
  const stxAddress = useAtomValue(stxAddressAtom);

  const [hasChecked, setHasChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [balanceV1, setBalanceV1] = useState(0);
  const [balanceV2, setBalanceV2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const MIA_TX_FILTER = buildCityTxFilter("mia");

  const filteredTransactions = useAtomValue(transactionsAtom).filter((tx) => {
    if (tx.tx_type !== "contract_call") return false;
    const contractId = tx.contract_call.contract_id;
    const func = tx.contract_call.function_name;
    return MIA_TX_FILTER.some(
      (filter) =>
        filter.contract === contractId && filter.functions.includes(func)
    );
  }) as ContractCallTransaction[];

  const [miningHistory, setMiningHistory] = useState<HistoryEntry[]>([]);
  const [isMiningLoading, setIsMiningLoading] = useState(true);

  const [stackingHistory, setStackingHistory] = useState<HistoryEntry[]>([]);
  const [isStackingLoading, setIsStackingLoading] = useState(true);

  useEffect(() => {
    if (!stxAddress) return;
    // Collect claimed mining blocks from claim txs
    const claimedMining: {
      block: number;
      claimTxId: string;
      contractId: string;
      functionName: string;
    }[] = [];
    filteredTransactions.forEach(
      (tx) => {
        const decoded = decodeTxArgs(tx);
        if (
          tx.tx_status === "success" &&
          decoded &&
          isValidMiningClaimTxArgs(decoded)
        ) {
          claimedMining.push({
            block: Number(decoded.minerBlockHeight),
            claimTxId: tx.tx_id,
            contractId: tx.contract_call.contract_id,
            functionName: tx.contract_call.function_name,
          });
        }
      },
      [filteredTransactions, stxAddress]
    );

    // Collect potential mining blocks from mining txs
    const potentialMining = new Map<
      number,
      { txId: string; contractId: string; functionName: string }
    >();
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidMiningTxArgs(decoded)) {
        const blocks = computeTargetedBlocks(tx, decoded);
        blocks.forEach((b) => {
          if (!potentialMining.has(b)) {
            potentialMining.set(b, {
              txId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
            });
          }
        });
      }
    });

    // Prepare history with claimed
    const historyMining: HistoryEntry[] = claimedMining.map((c) => ({
      id: c.block,
      txId: "", // will fill later
      claimTxId: c.claimTxId,
      status: "claimed",
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match mining tx for claimed
    historyMining.forEach((entry) => {
      const potential = potentialMining.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = "Unknown";
      }
    });

    // Filter potentials not claimed
    const toCheckMining = Array.from(potentialMining.entries()).filter(
      ([b]) => !claimedMining.some((c) => c.block === b)
    );

    setIsMiningLoading(true);
    const checkMiningPromises = toCheckMining.map(async ([block, info]) => {
      const [contractAddress, contractName] = info.contractId.split(".");
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "claim-mining-reward",
          functionArgs: [uintCV(block)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: block,
            txId: info.txId,
            status: "unclaimed" as const,
            contractId: info.contractId,
            functionName: info.functionName,
          };
        } else {
          return null;
        }
      } catch (e) {
        console.error(`Error checking mining block ${block}:`, e);
        return null;
      }
    });

    Promise.all(checkMiningPromises)
      .then((results) => {
        const unclaimedMining = results.filter(
          (r): r is HistoryEntry => r !== null
        );
        const fullHistory = [...historyMining, ...unclaimedMining].sort(
          (a, b) => a.id - b.id
        );
        setMiningHistory(fullHistory);
        setIsMiningLoading(false);
      })
      .catch((error) => {
        console.error("Error processing mining claims:", error);
        setIsMiningLoading(false);
      });

    // Similar for stacking
    const claimedStacking: {
      cycle: number;
      claimTxId: string;
      contractId: string;
      functionName: string;
    }[] = [];
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (
        tx.tx_status === "success" &&
        decoded &&
        isValidStackingClaimTxArgs(decoded)
      ) {
        claimedStacking.push({
          cycle: Number(decoded.rewardCycle),
          claimTxId: tx.tx_id,
          contractId: tx.contract_call.contract_id,
          functionName: tx.contract_call.function_name,
        });
      }
    });

    const potentialStacking = new Map<
      number,
      { txId: string; contractId: string; functionName: string }
    >();
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (
        decoded &&
        isValidStackingTxArgs(decoded) &&
        decoded.city &&
        decoded.version
      ) {
        const cycles = computeTargetedCycles(
          tx,
          decoded,
          decoded.city,
          decoded.version
        );
        cycles.forEach((c) => {
          if (!potentialStacking.has(c)) {
            potentialStacking.set(c, {
              txId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
            });
          }
        });
      }
    });

    // Prepare history with claimed
    const historyStacking: HistoryEntry[] = claimedStacking.map((c) => ({
      id: c.cycle,
      txId: "", // will fill later
      claimTxId: c.claimTxId,
      status: "claimed",
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match stacking tx for claimed
    historyStacking.forEach((entry) => {
      const potential = potentialStacking.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = "Unknown";
      }
    });

    // Filter potentials not claimed
    const toCheckStacking = Array.from(potentialStacking.entries()).filter(
      ([c]) => !claimedStacking.some((cl) => cl.cycle === c)
    );

    setIsStackingLoading(true);
    const checkStackingPromises = toCheckStacking.map(async ([cycle, info]) => {
      const [contractAddress, contractName] = info.contractId.split(".");
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "claim-stacking-reward",
          functionArgs: [uintCV(cycle)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: cycle,
            txId: info.txId,
            status: "unclaimed" as const,
            contractId: info.contractId,
            functionName: info.functionName,
          };
        } else {
          return null;
        }
      } catch (e) {
        console.error(`Error checking stacking cycle ${cycle}:`, e);
        return null;
      }
    });

    Promise.all(checkStackingPromises)
      .then((results) => {
        const unclaimedStacking = results.filter(
          (r): r is HistoryEntry => r !== null
        );
        const fullHistory = [...historyStacking, ...unclaimedStacking].sort(
          (a, b) => a.id - b.id
        );
        setStackingHistory(fullHistory);
        setIsStackingLoading(false);
      })
      .catch((error) => {
        console.error("Error processing stacking claims:", error);
        setIsStackingLoading(false);
      });
  }, [filteredTransactions, stxAddress]);

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

  const MIA_ASSET_ID = "miamicoin";
  const MIA_V1_CONTRACT =
    "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token";
  const MIA_V2_CONTRACT =
    "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2";

  const MIA_REDEMPTION_CONTRACT =
    "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-mia";

  const checkEligibility = async () => {
    console.log("Pending CCIP-026 vote and approval...");
    return;

    if (!stxAddress) return;

    setIsLoading(true);
    try {
      const url = `${HIRO_API}/extended/v1/address/${stxAddress}/balances`;
      const data = await fancyFetch<AddressBalanceResponse>(url);
      const v1Balance = parseInt(
        data.fungible_tokens?.[`${MIA_V1_CONTRACT}::${MIA_ASSET_ID}`]
          ?.balance || "0",
        10
      );
      const v2Balance = parseInt(
        data.fungible_tokens?.[`${MIA_V2_CONTRACT}::${MIA_ASSET_ID}`]
          ?.balance || "0",
        10
      );

      setBalanceV1(v1Balance);
      setBalanceV2(v2Balance);
      const eligible = v1Balance > 0 || v2Balance > 0;
      setIsEligible(eligible);
      setHasChecked(true);
      console.log("Eligibility checked:", { v1Balance, v2Balance, eligible });
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRedemption = async () => {
    console.log("Executing redemption...");
    const [address, name] = MIA_REDEMPTION_CONTRACT.split(".");
    try {
      await openContractCall({
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

  return (
    <Stack gap={4}>
      <Heading size="4xl">MIA Tools</Heading>
      <Text>Access tools and utilities for MiamiCoin (MIA) below.</Text>
      <Accordion.Root collapsible defaultValue={["redeem-mia"]}>
        <Accordion.Item value="redeem-mia">
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
              <Button
                variant="outline"
                onClick={checkEligibility}
                loading={isLoading}
                disabled={true}
              >
                Check Eligibility
              </Button>
              <Button
                variant="outline"
                onClick={executeRedemption}
                disabled={!hasChecked || !isEligible || isLoading}
              >
                Execute Redemption
              </Button>
            </Stack>
            {hasChecked && (
              <Stack mt={4}>
                <Text>MIA v1 Balance: {balanceV1}</Text>
                <Text>MIA v2 Balance: {balanceV2 / 1000000}</Text>
                <Text>
                  {isEligible
                    ? "You are eligible for redemption."
                    : "You are not eligible for redemption."}
                </Text>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="mining-history-mia">
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Mining History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            {isMiningLoading ? (
              <Stack align="center">
                <Spinner />
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
                                isExternal
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
                                  isExternal
                                >
                                  {shortenTxId(entry.claimTxId)}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === "unclaimed" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    console.log(`Claiming block ${entry.id}`)
                                  }
                                >
                                  Claim
                                </Button>
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
        <Accordion.Item value="stacking-history-mia">
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Stacking History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            {isStackingLoading ? (
              <Stack align="center">
                <Spinner />
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
                                isExternal
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
                                  isExternal
                                >
                                  {shortenTxId(entry.claimTxId)}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === "unclaimed" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    console.log(`Claiming cycle ${entry.id}`)
                                  }
                                >
                                  Claim
                                </Button>
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
        <Accordion.Item value="transactions-mia">
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
