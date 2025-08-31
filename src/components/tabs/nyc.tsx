import {
  Accordion,
  Button,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import { useState } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { openContractCall } from "@stacks/connect";
import { Pc, PostCondition } from "@stacks/transactions";

function Nyc() {
  const stxAddress = useAtomValue(stxAddressAtom);

  const [hasChecked, setHasChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [balanceV1, setBalanceV1] = useState(0);
  const [balanceV2, setBalanceV2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      const data = await fancyFetch<any>(url);
      const v1Balance = parseInt(
        data.fungible_tokens?.[NYC_V1_CONTRACT]?.balance || "0",
        10
      );
      const v2Balance = parseInt(
        data.fungible_tokens?.[NYC_V2_CONTRACT]?.balance || "0",
        10
      );

      setBalanceV1(v1Balance);
      setBalanceV2(v2Balance);
      const eligible = v1Balance > 0 || v2Balance > 0;
      setIsEligible(eligible);
      setHasChecked(true);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRedemption = () => {
    const [address, name] = NYC_REDEMPTION_CONTRACT.split(".");
    const postConditions: PostCondition[] = [];
    const v1PostCondition = balanceV1 ? Pc.principal(stxAddress).willSendEq(balanceV1).ft(NYC_V1_CONTRACT, "newyorkcitycoin") : undefined;
    const v2PostCondition = balanceV2 ? Pc.principal(stxAddress).willSendEq(balanceV2).ft(NYC_V2_CONTRACT, "newyorkcitycoin") : undefined;
    if (v1PostCondition) { postConditions.push(v1PostCondition) };
    if (v2PostCondition) { postConditions.push(v2PostCondition) };
    openContractCall({
      contractAddress: address,
      contractName: name,
      functionName: "redeem-nyc",
      functionArgs: [],
      postConditions: postConditions,
      onFinish: (data) => {
        console.log("Transaction finished:", data);
      },
      onCancel: () => {
        console.log("Transaction cancelled");
      },
    });
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
                <Text>NYC v2 Balance: {balanceV2}</Text>
                <Text>
                  {isEligible
                    ? "You are eligible for redemption."
                    : "You are not eligible for redemption."}
                </Text>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Nyc;
