import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import CityCoinsVoteV1 from "../votes/citycoins-vote-v1";
import CityCoinsVoteV2 from "../votes/citycoins-vote-v2";
import CityCoinsVoteV3 from "../votes/citycoins-vote-v3";
import CCIP014 from "../votes/ccip-014";
import CCIP017 from "../votes/ccip-017";

function Voting() {
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Proposals</Heading>
      <Text>View CityCoins proposal and vote details below.</Text>
      <Accordion allowToggle>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box
                as="span"
                fontWeight="bold"
                flex="1"
                display="flex"
                flexDirection={["column", "row"]}
                justifyContent="space-between"
                alignItems={["left", "center"]}
                textAlign="left"
              >
                <Text>Vote 1: Update emissions schedule</Text>
                <Badge
                  minW={100}
                  textAlign="center"
                  colorScheme="green"
                  p={[2, 4]}
                >
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
                flexDirection={["column", "row"]}
                justifyContent="space-between"
                alignItems={["left", "center"]}
                textAlign="left"
              >
                <Text>Vote 2: Stabilize protocol part 1</Text>
                <Badge
                  minW={100}
                  textAlign="center"
                  colorScheme="green"
                  p={[2, 4]}
                >
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
                flexDirection={["column", "row"]}
                justifyContent="space-between"
                alignItems={["left", "center"]}
                textAlign="left"
              >
                <Text>Vote 3: Stabilize protocol part 2</Text>
                <Badge
                  minW={100}
                  textAlign="center"
                  colorScheme="green"
                  p={[2, 4]}
                >
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
                flexDirection={["column", "row"]}
                justifyContent="space-between"
                alignItems={["left", "center"]}
                textAlign="left"
              >
                <Text>Vote 4: Upgrade to pox-3</Text>
                <Badge
                  minW={100}
                  textAlign="center"
                  colorScheme="green"
                  p={[2, 4]}
                >
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
                flexDirection={["column", "row"]}
                justifyContent="space-between"
                alignItems={["left", "center"]}
                textAlign="left"
              >
                <Text>Vote 5: Extend sunset period</Text>
                <Badge
                  minW={100}
                  textAlign="center"
                  colorScheme="gray"
                  p={[2, 4]}
                >
                  Pending
                </Badge>
              </Box>
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
