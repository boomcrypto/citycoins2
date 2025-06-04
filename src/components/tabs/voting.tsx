import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import VoteTitle from "../votes/vote-title";
import CityCoinsVoteV1 from "../votes/citycoins-vote-v1";
import CityCoinsVoteV2 from "../votes/citycoins-vote-v2";
import CityCoinsVoteV3 from "../votes/citycoins-vote-v3";
import CCIP014 from "../votes/ccip-014";
import CCIP017 from "../votes/ccip-017";
import CCIP021 from "../votes/ccip-021";
import CCIP020 from "../votes/ccip-020";
import CCIP022 from "../votes/ccip-022";
import CCIP019 from "../votes/ccip-019";
import CCIP024 from "../votes/ccip-024";
import CCIP025 from "../votes/ccip-025";
import CCIP016 from "../votes/ccip-016";

function Voting() {
  return (
    <Stack gap={4}>
      <Heading>CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 12: Mising Payouts"
                status="active"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP016 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 11: Extend Direct Execute Sunset Period 3"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP025 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 10: MiamiCoin Signal Vote"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP024 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle title="Vote 9: Stacking with PoX-4" status="passed" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP019 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 8: Treasury Redemption NYC"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP022 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 7: Graceful Protocol Shutdown"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP020 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 6: Extend sunset period 2"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP021 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle title="Vote 5: Extend sunset period" status="passed" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP017 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle title="Vote 4: Upgrade to pox-3" status="passed" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP014 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 3: Stabilize protocol part 2"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV3 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 2: Stabilize protocol part 1"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV2 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <VoteTitle
                title="Vote 1: Update emissions schedule"
                status="passed"
              />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV1 />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}

export default Voting;
