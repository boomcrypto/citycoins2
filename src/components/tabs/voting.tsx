import { Accordion, Heading, Stack, Text } from "@chakra-ui/react";
import VoteTitle from "../votes/vote-title";

import Ccip014 from "../votes/ccip-014";
import Ccip017 from "../votes/ccip-017";
import Ccip019 from "../votes/ccip-019";
import Ccip020 from "../votes/ccip-020";
import CCIP016 from "../votes/ccip-016";

function Voting() {
  return (
    <Stack gap={4}>
      <Heading size="4xl">CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion.Root multiple>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 11: Upgrade to PoX-3 (CCIP-014)"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip014 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 13: Extend Sunset Period (CCIP-017)"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip017 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 14: MIA PoX-4 Stacking (CCIP-019)"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip019 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 15: Graceful Protocol Shutdown (CCIP-020)"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip020 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 12: Missing Payouts (CCIP-016)"
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
