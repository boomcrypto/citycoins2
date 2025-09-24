import {
  Accordion,
  Badge,
  Box,
  Button,
  Heading,
  Link,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import {
  stxAddressAtom,
  transactionsAtom,
  minedBlocksAtom,
  claimedBlocksAtom,
  stackedCyclesAtom,
  claimedCyclesAtom,
} from "../../store/stacks";
import SignIn from "../auth/sign-in";
import { useState } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { request } from "@stacks/connect";
import {
  AddressBalanceResponse,
  ContractCallTransaction,
} from "@stacks/stacks-blockchain-api-types";
import TransactionList from "../transaction-list";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { buildCityTxFilter } from "../../config/contracts";

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

function Nyc({ onOpenDetails }: NycProps) {
  const stxAddress = useAtomValue(stxAddressAtom);
  const minedBlocks = useAtomValue(minedBlocksAtom);
  const claimedBlocks = useAtomValue(claimedBlocksAtom);
  const stackedCycles = useAtomValue(stackedCyclesAtom);
  const claimedCycles = useAtomValue(claimedCyclesAtom);

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
      await request("stx_callContract", {
        contract: `${address}.${name}`,
        functionName: "redeem-nyc",
        functionArgs: [],
        postConditionMode: "allow",
      });
    } catch (error) {
      console.error("Error executing redemption:", error);
    }
  };

  const allClaimedBlocks = Array.from(
    new Set(Array.from(claimedBlocks.values()).flat())
  );
  const allClaimedCycles = Array.from(
    new Set(Array.from(claimedCycles.values()).flat())
  );

  // Maps for block/cycle to tx
  const blockToTx = new Map<number, string>();
  filteredTransactions.forEach((tx) => {
    const blocks = minedBlocks.get(tx.tx_id) || [];
    blocks.forEach((block) => blockToTx.set(block, tx.tx_id));
  });

  const cycleToTx = new Map<number, string>();
  filteredTransactions.forEach((tx) => {
    const cycles = stackedCycles.get(tx.tx_id) || [];
    cycles.forEach((cycle) => cycleToTx.set(cycle, tx.tx_id));
  });

  const uniqueMinedBlocks = Array.from(
    new Set(
      filteredTransactions.flatMap((tx) => minedBlocks.get(tx.tx_id) || [])
    )
  ).sort((a, b) => a - b);
  const claimedMinedCount = uniqueMinedBlocks.filter((block) =>
    allClaimedBlocks.includes(block)
  ).length;
  const unclaimedMinedCount = uniqueMinedBlocks.length - claimedMinedCount;

  const uniqueStackedCycles = Array.from(
    new Set(
      filteredTransactions.flatMap((tx) => stackedCycles.get(tx.tx_id) || [])
    )
  ).sort((a, b) => a - b);
  const claimedStackedCount = uniqueStackedCycles.filter((cycle) =>
    allClaimedCycles.includes(cycle)
  ).length;
  const unclaimedStackedCount = uniqueStackedCycles.length - claimedStackedCount;

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
            <Stack gap={4}>
              <Stack direction="row" gap={4} flexWrap="wrap">
                <Badge variant="outline">
                  Total Mined Blocks: {uniqueMinedBlocks.length}
                </Badge>
                <Badge colorScheme="green" variant="outline">
                  Claimed: {claimedMinedCount}
                </Badge>
                <Badge colorScheme="red" variant="outline">
                  Unclaimed: {unclaimedMinedCount}
                </Badge>
              </Stack>
              {uniqueMinedBlocks.length === 0 ? (
                <Text>No matching transactions found.</Text>
              ) : (
                <Box overflowX="auto">
                  <Table.Root variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Block</Table.ColumnHeader>
                        <Table.ColumnHeader>Contract</Table.ColumnHeader>
                        <Table.ColumnHeader>Function</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {uniqueMinedBlocks.map((block) => {
                        const txId = blockToTx.get(block);
                        const tx = filteredTransactions.find(
                          (t) => t.tx_id === txId
                        );
                        const contract = tx
                          ? shortenPrincipal(tx.contract_call.contract_id)
                          : "Unknown";
                        const func = tx
                          ? tx.contract_call.function_name
                          : "Unknown";
                        const isClaimed = allClaimedBlocks.includes(block);
                        return (
                          <Table.Row key={block}>
                            <Table.Cell>{block}</Table.Cell>
                            <Table.Cell>{contract}</Table.Cell>
                            <Table.Cell>{func}</Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorScheme={isClaimed ? "green" : "red"}
                              >
                                {isClaimed ? "Claimed" : "Unclaimed"}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="stacking-history-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Stacking History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap={4}>
              <Stack direction="row" gap={4} flexWrap="wrap">
                <Badge variant="outline">
                  Total Stacked Cycles: {uniqueStackedCycles.length}
                </Badge>
                <Badge colorScheme="green" variant="outline">
                  Claimed: {claimedStackedCount}
                </Badge>
                <Badge colorScheme="red" variant="outline">
                  Unclaimed: {unclaimedStackedCount}
                </Badge>
              </Stack>
              {uniqueStackedCycles.length === 0 ? (
                <Text>No matching transactions found.</Text>
              ) : (
                <Box overflowX="auto">
                  <Table.Root variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Cycle</Table.ColumnHeader>
                        <Table.ColumnHeader>Contract</Table.ColumnHeader>
                        <Table.ColumnHeader>Function</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {uniqueStackedCycles.map((cycle) => {
                        const txId = cycleToTx.get(cycle);
                        const tx = filteredTransactions.find(
                          (t) => t.tx_id === txId
                        );
                        const contract = tx
                          ? shortenPrincipal(tx.contract_call.contract_id)
                          : "Unknown";
                        const func = tx
                          ? tx.contract_call.function_name
                          : "Unknown";
                        const isClaimed = allClaimedCycles.includes(cycle);
                        return (
                          <Table.Row key={cycle}>
                            <Table.Cell>{cycle}</Table.Cell>
                            <Table.Cell>{contract}</Table.Cell>
                            <Table.Cell>{func}</Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorScheme={isClaimed ? "green" : "red"}
                              >
                                {isClaimed ? "Claimed" : "Unclaimed"}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Stack>
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
