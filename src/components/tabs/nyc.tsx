import { Accordion, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";

function Nyc() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">Tools and Utilities for NYC</Heading>
        <Text>Wallet connection required to access tools and utilities for NYC.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading size="4xl">Tools and Utilities for NYC</Heading>
      <Text>Access tools and utilities for NYC below.</Text>
      <Accordion.Root collapsible defaultValue={["redeem-nyc"]}>
        <Accordion.Item value="redeem-nyc">
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem NYC</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack direction="row" gap={4}>
              <Button variant="outline">Check Eligibility</Button>
              <Button variant="outline">Execute Redemption</Button>
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Nyc;
