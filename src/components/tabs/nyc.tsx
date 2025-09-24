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
import { useAtomValue } from "jotai";
import { stxAddressAtom, transactionsAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import { useEffect, useState } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { openContractCall } from "@stacks/connect";
import {
  AddressBalanceResponse,
  ContractCallTransaction,
} from "@stacks/stacks-blockchain-api-types";
import TransactionList from "../transaction-list";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { buildCityTxFilter } from "../../config/contracts";
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
import { uintCV } from "@stacks/transactions";

interface NycProps {
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

interface HistoryEntry {
  id: number;
  txId: string;
  claimTxId?: string;
  status: 'claimed' | 'unclaimed';
  contractId: string;
  functionName: string;
}

function Nyc({ onOpenDetails }: NycProps) {
  const stxAddress = useAtomValue(stxAddressAtom);

  const [hasChecked, setHasChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [balanceV1, setBalanceV1] = useState(0);
  const [balanceV2, setBalanceV2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Build NYC_TX_FILTER dynamically from config to include all relevant contracts/functions
  const NYC_TX_FILTER = buildCityTxFilter("nyc");

  const filteredTransactions = useAtomValue(transactionsAtom).filter((tx) => {
    if (tx.tx_type !== "contract_call") return false;
    const contractId = tx.contract_call.contract_id;
    const func = tx.contract_call.function_name;
    const matches = NYC_TX_FILTER.some(
      (filter) =>
        filter.contract === contractId && filter.functions.includes(func)
    );
    return matches;
  }) as ContractCallTransaction[];

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">NYC Tools</Heading>
        <Text>
          Wallet connection required to access tools and utilities for
          NewYorkCityCoin (NYC).
        </Text>
        <SignIn />
      </Stack>
    );
  }

  const [miningHistory, setMiningHistory] = useState<HistoryEntry[]>([]);
  const [isMiningLoading, setIsMiningLoading] = useState(true);

  const [stackingHistory, setStackingHistory] = useState<HistoryEntry[]>([]);
  const [isStackingLoading, setIsStackingLoading] = useState(true);

  useEffect(() => {
    // Collect claimed mining blocks from claim txs
    const claimedMining: { block: number; claimTxId: string; contractId: string; functionName: string }[] = [];
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (tx.tx_status === 'success' && decoded && isValidMiningClaimTxArgs(decoded)) {
        claimedMining.push({
          block: Number(decoded.minerBlockHeight),
          claimTxId: tx.tx_id,
          contractId: tx.contract_call.contract_id,
          functionName: tx.contract_call.function_name,
        });
      }
    });

    // Collect potential mining blocks from mining txs
    const potentialMining = new Map<number, { txId: string; contractId: string; functionName: string }>();
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
      txId: '', // will fill later
      claimTxId: c.claimTxId,
      status: 'claimed',
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match mining tx for claimed
    historyMining.forEach((entry) => {
      const potential = potentialMining.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = 'Unknown';
      }
    });

    // Filter potentials not claimed
    const toCheckMining = Array.from(potentialMining.entries()).filter(([b]) => !claimedMining.some((c) => c.block === b));

    setIsMiningLoading(true);
    const checkMiningPromises = toCheckMining.map(async ([block, info]) => {
      const [contractAddress, contractName] = info.contractId.split('.');
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'claim-mining-reward',
          functionArgs: [uintCV(block)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: block,
            txId: info.txId,
            status: 'unclaimed' as const,
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

    Promise.all(checkMiningPromises).then((results) => {
      const unclaimedMining = results.filter((r): r is HistoryEntry => r !== null);
      const fullHistory = [...historyMining, ...unclaimedMining].sort((a, b) => a.id - b.id);
      setMiningHistory(fullHistory);
      setIsMiningLoading(false);
    });

    // Similar for stacking
    const claimedStacking: { cycle: number; claimTxId: string; contractId: string; functionName: string }[] = [];
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (tx.tx_status === 'success' && decoded && isValidStackingClaimTxArgs(decoded)) {
        claimedStacking.push({
          cycle: Number(decoded.rewardCycle),
          claimTxId: tx.tx_id,
          contractId: tx.contract_call.contract_id,
          functionName: tx.contract_call.function_name,
        });
      }
    });

    const potentialStacking = new Map<number, { txId: string; contractId: string; functionName: string }>();
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidStackingTxArgs(decoded) && decoded.city && decoded.version) {
        const cycles = computeTargetedCycles(tx, decoded, decoded.city, decoded.version);
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
      txId: '', // will fill later
      claimTxId: c.claimTxId,
      status: 'claimed',
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match stacking tx for claimed
    historyStacking.forEach((entry) => {
      const potential = potentialStacking.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = 'Unknown';
      }
    });

    // Filter potentials not claimed
    const toCheckStacking = Array.from(potentialStacking.entries()).filter(([c]) => !claimedStacking.some((cl) => cl.cycle === c));

    setIsStackingLoading(true);
    const checkStackingPromises = toCheckStacking.map(async ([cycle, info]) => {
      const [contractAddress, contractName] = info.contractId.split('.');
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'claim-stacking-reward',
          functionArgs: [uintCV(cycle)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: cycle,
            txId: info.txId,
            status: 'unclaimed' as const,
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

    Promise.all(checkStackingPromises).then((results) => {
      const unclaimedStacking = results.filter((r): r is HistoryEntry => r !== null);
      const fullHistory = [...historyStacking, ...unclaimedStacking].sort((a, b) => a.id - b.id);
      setStackingHistory(fullHistory);
      setIsStackingLoading(false);
    });
  }, [filteredTransactions, stxAddress]);

  const NYC_ASSET_ID = "newyorkcitycoin";
  const NYC_V1_CONTRACT =
    "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token";
  const NYC_V2_CONTRACT =
    "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2";

  const NYC_REDEMPTION_CONTRACT =
    "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc";

  const checkEligibility = async () => {
    if (!stxAddress) return;

    setIsLoading(true);
    try {
      const url = `${HIRO_API}/extended/v1/address/${stxAddress}/balances`;
      const data = await fancyFetch<AddressBalanceResponse>(url);
      //console.log("fetched balance data from Hiro:");
      //console.log(JSON.stringify(data, null, 2));
      const v1Balance = parseInt(
        data.fungible_tokens?.[`${NYC_V1_CONTRACT}::${NYC_ASSET_ID}`]
          ?.balance || "0",
        10
      );
      const v2Balance = parseInt(
        data.fungible_tokens?.[`${NYC_V2_CONTRACT}::${NYC_ASSET_ID}`]
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
    const [address, name] = NYC_REDEMPTION_CONTRACT.split(".");
    /* Need to double check post conditions required here
    - also add a contract will transfer? look up amount for balance?
    const postConditions: PostCondition[] = [];
    const v1PostCondition = balanceV1 ? Pc.principal(stxAddress).willSendEq(balanceV1).ft(NYC_V1_CONTRACT, "newyorkcitycoin") : undefined;
    const v2PostCondition = balanceV2 ? Pc.principal(stxAddress).willSendEq(balanceV2).ft(NYC_V2_CONTRACT, "newyorkcitycoin") : undefined;
    if (v1PostCondition) { postConditions.push(v1PostCondition) };
    if (v2PostCondition) { postConditions.push(v2PostCondition) };
    */
    try {
      await openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: "redeem-nyc",
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
      <Heading size="4xl">NYC Tools</Heading>
      <Text>Access tools and utilities for NewYorkCityCoin (NYC) below.</Text>
      <Accordion.Root collapsible defaultValue={["redeem-nyc"]}>
        <Accordion.Item value="redeem-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem NYC</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Text mb={4}>
              Burn NYC to receive STX per{" "}
              <Link
                href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
                rel="noopener noreferrer"
                target="_blank"
              >
                CCIP-022
              </Link>
              .
            </Text>
            <Stack direction="row" gap={4}>
              <Button
                variant="outline"
                onClick={checkEligibility}
                loading={isLoading}
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
                <Text>NYC v1 Balance: {balanceV1}</Text>
                <Text>NYC v2 Balance: {balanceV2 / 1000000}</Text>
                <Text>
                  {isEligible
                    ? "You are eligible for redemption."
                    : "You are not eligible for redemption."}
                </Text>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="mining-history-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Mining History</Heading>
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
                    Claimed: {miningHistory.filter(h => h.status === 'claimed').length}
                  </Badge>
                  <Badge colorScheme="red" variant="outline">
                    Unclaimed: {miningHistory.filter(h => h.status === 'unclaimed').length}
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
                            <Table.Cell>{shortenPrincipal(entry.contractId)}</Table.Cell>
                            <Table.Cell>{entry.functionName}</Table.Cell>
                            <Table.Cell>
                              <Badge colorScheme={entry.status === 'claimed' ? 'green' : 'red'}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
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
                              ) : 'N/A'}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === 'unclaimed' && (
                                <Button size="sm" onClick={() => console.log(`Claiming block ${entry.id}`)}>
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
        <Accordion.Item value="stacking-history-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Stacking History</Heading>
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
                    Claimed: {stackingHistory.filter(h => h.status === 'claimed').length}
                  </Badge>
                  <Badge colorScheme="red" variant="outline">
                    Unclaimed: {stackingHistory.filter(h => h.status === 'unclaimed').length}
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
                            <Table.Cell>{shortenPrincipal(entry.contractId)}</Table.Cell>
                            <Table.Cell>{entry.functionName}</Table.Cell>
                            <Table.Cell>
                              <Badge colorScheme={entry.status === 'claimed' ? 'green' : 'red'}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
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
                              ) : 'N/A'}
                            </Table.Cell>
                            <Table.Cell>
                              {entry.status === 'unclaimed' && (
                                <Button size="sm" onClick={() => console.log(`Claiming cycle ${entry.id}`)}>
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
        <Accordion.Item value="transactions-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Transactions</Heading>
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

export default Nyc;
