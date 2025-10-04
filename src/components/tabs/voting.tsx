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
import CCIP026 from "../votes/ccip-026";

function Voting() {
  const voteItems = [
    {
      id: "ccip026",
      title: "Vote 13: Burn to exit MIA (CCIP-026)",
      status: "active" as const,
      Component: CCIP026,
    },
    {
      id: "ccip016",
      title: "Vote 12: Missing Payouts (CCIP-016)",
      status: "passed" as const,
      Component: CCIP016,
    },
    {
      id: "ccip025",
      title: "Vote 11: Extend Direct Execute Sunset Period 3",
      status: "passed" as const,
      Component: Ccip025,
    },
    {
      id: "ccip024",
      title: "Vote 10: MiamiCoin Signal Vote",
      status: "passed" as const,
      Component: Ccip024,
    },
    {
      id: "ccip019",
      title: "Vote 9: Stacking with PoX-4",
      status: "passed" as const,
      Component: Ccip019,
    },
    {
      id: "ccip022",
      title: "Vote 8: Treasury Redemption NYC",
      status: "passed" as const,
      Component: Ccip022,
    },
    {
      id: "ccip020",
      title: "Vote 7: Graceful Protocol Shutdown",
      status: "passed" as const,
      Component: Ccip020,
    },
    {
      id: "ccip021",
      title: "Vote 6: Extend sunset period 2",
      status: "passed" as const,
      Component: Ccip021,
    },
    {
      id: "ccip017",
      title: "Vote 5: Extend sunset period",
      status: "passed" as const,
      Component: Ccip017,
    },
    {
      id: "ccip014",
      title: "Vote 4: Upgrade to pox-3",
      status: "passed" as const,
      Component: Ccip014,
    },
    {
      id: "vote-v3",
      title: "Vote 3: Stabilize protocol part 2",
      status: "passed" as const,
      Component: CityCoinsVoteV3,
    },
    {
      id: "vote-v2",
      title: "Vote 2: Stabilize protocol part 1",
      status: "passed" as const,
      Component: CityCoinsVoteV2,
    },
    {
      id: "vote-v1",
      title: "Vote 1: Update emissions schedule",
      status: "passed" as const,
      Component: CityCoinsVoteV1,
    },
  ];

  return (
    <Stack gap={4}>
      <Heading size="4xl">CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion.Root multiple defaultValue={["ccip026"]}>
        {voteItems.map((item) => (
          <Accordion.Item key={item.id} value={item.id}>
            <Accordion.ItemTrigger>
              <VoteTitle title={item.title} status={item.status} />
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <item.Component />
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Stack>
  );
}

export default Voting;
