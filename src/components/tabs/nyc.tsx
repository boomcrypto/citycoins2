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
import { useState } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { request } from "@stacks/connect";
import { AddressBalanceResponse } from "@stacks/stacks-blockchain-api-types";
import TransactionList from "../transaction-list";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { CONTRACTS } from "../../config/contracts"; // Import config for dynamic filter
import { Box } from "@chakra-ui/react";

interface NycProps {
  onOpenDetails: (tx: Transaction) => void;
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
  const NYC_TX_FILTER: { contract: string; functions: string[] }[] = [
    // Core contracts
    {
      contract: CONTRACTS.nyc.v1.core,
      functions: [
        ...CONTRACTS.nyc.functions.mining,
        ...CONTRACTS.nyc.functions.miningClaims,
        ...CONTRACTS.nyc.functions.stacking,
        ...CONTRACTS.nyc.functions.stackingClaims,
      ],
    },
    {
      contract: CONTRACTS.nyc.v1.token,
      functions: CONTRACTS.nyc.functions.transfer,
    },
    {
      contract: CONTRACTS.nyc.v2.core,
      functions: [
        ...CONTRACTS.nyc.functions.mining,
        ...CONTRACTS.nyc.functions.miningClaims,
        ...CONTRACTS.nyc.functions.stacking,
        ...CONTRACTS.nyc.functions.stackingClaims,
      ],
    },
    {
      contract: CONTRACTS.nyc.v2.token,
      functions: CONTRACTS.nyc.functions.transfer,
    },
    // Mining contracts (v1 and v2)
    ...(CONTRACTS.nyc.miningV1 ? [{
      contract: CONTRACTS.nyc.miningV1,
      functions: CONTRACTS.nyc.functions.mining,
    }] : []),
    ...(CONTRACTS.nyc.miningV2 ? [{
      contract: CONTRACTS.nyc.miningV2,
      functions: CONTRACTS.nyc.functions.mining,
    }] : []),
    // Stacking contracts (if needed)
    ...(CONTRACTS.nyc.stackingV2 ? [{
      contract: CONTRACTS.nyc.stackingV2,
      functions: CONTRACTS.nyc.functions.stacking,
    }] : []),
  ];

  const filteredTransactions = useAtomValue(transactionsAtom).filter((tx) => {
    if (tx.tx_type !== "contract_call") return false;
    const contractId = tx.contract_call.contract_id;
    const func = tx.contract_call.function_name;
    const matches = NYC_TX_FILTER.some(
      (filter) =>
        filter.contract === contractId && filter.functions.includes(func)
    );
    console.log(`Checking tx ${tx.tx_id} for NYC filter: contract=${contractId}, function=${func}, matches=${matches}`); // Debug log
    return matches;
  });

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

  const allClaimedBlocks = Array.from(new Set(Array.from(claimedBlocks.values()).flat()));

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
          <Accordion.ItemContent p={4}>
            <Text mb={4}>
              Burn NYC to receive STX per{" "}
              <Link
                href="https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md"
                isExternal
              >
                CCIP-022
              </Link>
              .
            </Text>
            <Stack direction="row" gap={4}>
              <Button
                variant="outline"
                onClick={checkEligibility}
                isLoading={isLoading}
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
        <Accordion.Item value="mining-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Mining History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Stack gap={4}>
              {Array.from(new Set(filteredTransactions.flatMap(tx => minedBlocks.get(tx.tx_id) || []))).sort((a,b)=>a-b).map(block => (
                <Text key={block}>Block {block} {allClaimedBlocks.includes(block) ? <Badge colorScheme="green">Claimed</Badge> : <Badge colorScheme="red">Unclaimed</Badge>}</Text>
              ))}
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="stacking-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Stacking History</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Stack gap={4}>
              <Box>
                <Heading size="md">Stacked Cycles</Heading>
                <Stack gap={2}>
                  {Array.from(new Set(filteredTransactions.flatMap(tx => stackedCycles.get(tx.tx_id) || []))).sort((a,b)=>a-b).map(cycle => (
                    <Text key={cycle}>Cycle {cycle}</Text>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Heading size="md">Claimed Cycles</Heading>
                <Stack gap={2}>
                  {Array.from(new Set(filteredTransactions.flatMap(tx => claimedCycles.get(tx.tx_id) || []))).sort((a,b)=>a-b).map(cycle => (
                    <Text key={cycle}>Cycle {cycle}</Text>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="transactions">
          <Accordion.ItemTrigger>
            <Heading size="xl">NYC Transactions</Heading>
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

export default Nyc;
