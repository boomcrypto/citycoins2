import {
  Accordion,
  AccordionItem,
  AccordionItemIndicator,
  AccordionItemTrigger,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import VoteTitle from "../votes/vote-title";

import CCIP016 from "../votes/ccip-016";

function Voting() {
  return (
    <Stack gap={4}>
      <Heading size="4xl">CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion.Root allowMultiple>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 12: Mising Payouts (CCIP-016)"
              status="active"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <CCIP016 />
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Voting;
