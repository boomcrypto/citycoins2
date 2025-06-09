import { Accordion, Heading, Stack, Text } from "@chakra-ui/react";
import VoteTitle from "../votes/vote-title";

import CityCoinsVoteV1 from "../votes/citycoins-vote-v1";
import CityCoinsVoteV2 from "../votes/citycoins-vote-v2";
import CityCoinsVoteV3 from "../votes/citycoins-vote-v3";
import Ccip014 from "../votes/ccip-014";
import Ccip017 from "../votes/ccip-017";
import Ccip019 from "../votes/ccip-019";
import Ccip020 from "../votes/ccip-020";
import Ccip021 from "../votes/ccip-021";
import Ccip022 from "../votes/ccip-022";
import Ccip024 from "../votes/ccip-024";
import Ccip025 from "../votes/ccip-025";
import CCIP016 from "../votes/ccip-016";

function Voting() {
  return (
    <Stack gap={4}>
      <Heading size="4xl">CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion.Root collapsible defaultValue={["ccip016"]}>
        <Accordion.Item key="ccip016" value="ccip016">
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
        <Accordion.Item key="ccip025" value="ccip025">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 11: Extend Direct Execute Sunset Period 3"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip025 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip024" value="ccip024">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 10: MiamiCoin Signal Vote"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip024 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip019" value="ccip019">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 9: Stacking with PoX-4"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip019 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip022" value="ccip022">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 8: Treasury Redemption NYC"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip022 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip020" value="ccip020">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 7: Graceful Protocol Shutdown"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip020 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip021" value="ccip021">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 6: Extend sunset period 2"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip021 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip017" value="ccip017">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 5: Extend sunset period"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip017 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="ccip014" value="ccip014">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 4: Upgrade to pox-3"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Ccip014 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="vote-v3" value="vote-v3">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 3: Stabilize protocol part 2"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <CityCoinsVoteV3 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="vote-v2" value="vote-v2">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 2: Stabilize protocol part 1"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <CityCoinsVoteV2 />
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item key="vote-v1" value="vote-v1">
          <Accordion.ItemTrigger>
            <VoteTitle
              title="Vote 1: Update emissions schedule"
              status="passed"
            />
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <CityCoinsVoteV1 />
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}

export default Voting;
