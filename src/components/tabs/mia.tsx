import {
  Accordion,
  Button,
  Heading,
  Link,
  Stack,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom, transactionsAtom, minedBlocksAtom, claimedBlocksAtom, stackedCyclesAtom, claimedCyclesAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";
import { useState } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { request } from "@stacks/connect";
import { AddressBalanceResponse } from "@stacks/stacks-blockchain-api-types";
import { Transaction } from "@stacks/stacks-blockchain-api-types";

interface MiaProps {
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

function Mia({ onOpenDetails }: MiaProps) {
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

  const MIA_TX_FILTER: { contract: string; functions: string[] }[] = [
    {
      contract: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1",
      functions: [
        "mine-tokens",
        "mine-many",
        "claim-mining-reward",
        "stack-tokens",
        "claim-stacking-reward",
      ],
    },
    {
      contract: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token",
      functions: ["transfer"],
    },
    {
      contract: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2",
      functions: [
        "mine-tokens",
        "mine-many",
        "claim-mining-reward",
        "stack-tokens",
        "claim-stacking-reward",
      ],
    },
    {
      contract: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2",
      functions: ["transfer"],
    },
    // add more as needed
  ];

  const filteredTransactions = useAtomValue(transactionsAtom).filter((tx) => {
    if (tx.tx_type !== "contract_call") return false;
    const contractId = tx.contract_call.contract_id;
    const func = tx.contract_call.function_name;
    return MIA_TX_FILTER.some(
      (filter) =>
        filter.contract === contractId && filter.functions.includes(func)
    );
  });

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
      await request("stx_callContract", {
        contract: `${address}.${name}`,
        functionName: "redeem-mia",
        functionArgs: [],
        postConditionMode: "allow",
      });
    } catch (error) {
      console.error("Error executing redemption:", error);
    }
  };

  const allClaimedBlocks = Array.from(new Set(Array.from(claimedBlocks.values()).flat()));
  const allClaimedCycles = Array.from(new Set(Array.from(claimedCycles.values()).flat()));

  // Maps for block/cycle to tx
  const blockToTx = new Map<number, string>();
  filteredTransactions.forEach(tx => {
    const blocks = minedBlocks.get(tx.tx_id) || [];
    blocks.forEach(block => blockToTx.set(block, tx.tx_id));
  });

  const cycleToTx = new Map<number, string>();
  filteredTransactions.forEach(tx => {
    const cycles = stackedCycles.get(tx.tx_id) || [];
    cycles.forEach(cycle => cycleToTx.set(cycle, tx.tx_id));
  });

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
          <Accordion.ItemContent p={4}>
            <Text mb={4}>
              Burn MIA to receive STX per{" "}
              <Link
                href="https://github.com/citycoins/governance/pull/50"
                isExternal
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
                isLoading={isLoading}
                isDisabled={true}
              >
                Check Eligibility
              </Button>
              <Button
                variant="outline"
                onClick={executeRedemption}
                isDisabled={!hasChecked || !isEligible || isLoading}
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
        <Accordion.Item value="mining-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Mining History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            {Array.from(new Set(filteredTransactions.flatMap(tx => minedBlocks.get(tx.tx_id) || []))).sort((a,b)=>a-b).length === 0 ? (
              <Text>No matching transactions found.</Text>
            ) : (
              <Stack gap={4}>
                {Array.from(new Set(filteredTransactions.flatMap(tx => minedBlocks.get(tx.tx_id) || []))).sort((a,b)=>a-b).map(block => {
                  const txId = blockToTx.get(block);
                  const tx = filteredTransactions.find(t => t.tx_id === txId);
                  const contract = tx ? shortenPrincipal(tx.contract_call.contract_id) : 'Unknown';
                  const func = tx ? tx.contract_call.function_name : 'Unknown';
                  return <Text key={block}>Block {block} - {contract} {func} {allClaimedBlocks.includes(block) ? <Badge colorScheme="green">Claimed</Badge> : <Badge colorScheme="red">Unclaimed</Badge>}</Text>;
                })}
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="stacking-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Stacking History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            {Array.from(new Set(filteredTransactions.flatMap(tx => stackedCycles.get(tx.tx_id) || []))).sort((a,b)=>a-b).length === 0 ? (
              <Text>No matching transactions found.</Text>
            ) : (
              <Stack gap={4}>
                {Array.from(new Set(filteredTransactions.flatMap(tx => stackedCycles.get(tx.tx_id) || []))).sort((a,b)=>a-b).map(cycle => {
                  const txId = cycleToTx.get(cycle);
                  const tx = filteredTransactions.find(t => t.tx_id === txId);
                  const contract = tx ? shortenPrincipal(tx.contract_call.contract_id) : 'Unknown';
                  const func = tx ? tx.contract_call.function_name : 'Unknown';
                  return <Text key={cycle}>Cycle {cycle} - {contract} {func} {allClaimedCycles.includes(cycle) ? <Badge colorScheme="green">Claimed</Badge> : <Badge colorScheme="red">Unclaimed</Badge>}</Text>;
                })}
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="transactions">
          <Accordion.ItemTrigger>
            <Heading size="xl">MIA Transactions</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <TransactionList transactions={filteredTransactions} onOpenDetails={onOpenDetails} />
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Mia;
