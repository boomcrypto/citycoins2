import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Heading,
  Text,
} from "@chakra-ui/react";
import CityCoinsVoteV1 from "../votes/citycoins-vote-v1";
import CityCoinsVoteV2 from "../votes/citycoins-vote-v2";
import CityCoinsVoteV3 from "../votes/citycoins-vote-v3";
import CCIP014 from "../votes/ccip-014";
import CCIP017 from "../votes/ccip-017";

function Voting() {
  return (
    <>
      <Heading mb={4}>CityCoins Proposals</Heading>
      <Accordion allowToggle>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                textAlign="left"
              >
                <Text>Vote 1: Update emissions schedule</Text>
                <Badge colorScheme="green" p={[2, 4]}>
                  Passed
                </Badge>
              </Box>
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV1 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                textAlign="left"
              >
                <Text>Vote 2: Stabilize protocol part 1</Text>
                <Badge colorScheme="green" p={[2, 4]}>
                  Passed
                </Badge>
              </Box>
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV2 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                textAlign="left"
              >
                <Text>Vote 3: Stabilize protocol part 2</Text>
                <Badge colorScheme="green" p={[2, 4]}>
                  Passed
                </Badge>
              </Box>
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CityCoinsVoteV3 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                textAlign="left"
              >
                <Text>Vote 4: Upgrade to pox-3</Text>
                <Badge colorScheme="green" p={[2, 4]}>
                  Passed
                </Badge>
              </Box>
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP014 />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                textAlign="left"
              >
                <Text>Vote 5: Extend sunset period</Text>
                <Badge colorScheme="orange" p={[2, 4]}>
                  Active
                </Badge>
              </Box>
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CCIP017 />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>
  );
}

export default Voting;
