import { Accordion, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";

function Mia() {
  const stxAddress = useAtomValue(stxAddressAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">Tools and Utilities for MIA</Heading>
        <Text>Wallet connection required to access tools and utilities for MIA.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading size="4xl">Tools and Utilities for MIA</Heading>
      <Text>Access tools and utilities for MIA below.</Text>
      <Accordion.Root collapsible defaultValue={["redeem-mia"]}>
        <Accordion.Item value="redeem-mia">
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem MIA</Heading>
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

export default Mia;
