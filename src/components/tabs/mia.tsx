import { Accordion, Button, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";

function Mia() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">MIA Tools</Heading>
        <Text>Wallet connection required to access tools and utilities for MiamiCoin (MIA).</Text>
        <SignIn />
      </Stack>
    );
  }

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
              <Text as="span" color="gray.500">Pending approval.</Text>
            </Text>
            <Stack direction="row" gap={4}>
              <Button variant="outline" disabled>Check Eligibility</Button>
              <Button variant="outline" disabled>Execute Redemption</Button>
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Mia;
