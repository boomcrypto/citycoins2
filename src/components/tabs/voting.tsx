import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import CityCoinsVoteV1 from "../votes/citycoins-vote-v1";
import CityCoinsVoteV2 from "../votes/citycoins-vote-v2";
import CityCoinsVoteV3 from "../votes/citycoins-vote-v3";
import CCIP014 from "../votes/ccip-014";
import CCIP017 from "../votes/ccip-017";
import VoteTitle from "../votes/vote-title";

function Voting() {
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion allowToggle>
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
              <VoteTitle title="Vote 5: Extend sunset period" status="active" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP017 />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}

export default Voting;
