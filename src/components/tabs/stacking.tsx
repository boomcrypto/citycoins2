import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Heading,
  IconButton,
  ListItem,
  Spacer,
  Stack,
  Text,
  UnorderedList,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaQuestion } from "react-icons/fa";

function StackingForm() {
  return (
    <form id="stacking">
      <Stack spacing={8}>
        <Text>Form goes here</Text>
      </Stack>
    </form>
  );
}

function Stacking() {
  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="space-betwen">
        <Heading>CityCoins Stacking</Heading>
        <Spacer />
        <IconButton
          aria-label="Stacking Info"
          title="Stacking Info"
          icon={<FaQuestion />}
          as="a"
          href="https://docs.citycoins.co/core-protocol/stacking-citycoins"
          target="_blank"
          rel="noopener noreferrer"
        />
      </Stack>
      <Text>
        Stacking CityCoins locks the tokens in a contract for a selected number
        of reward cycles.
      </Text>
      <Text>
        In return, stackers can claim a portion of the STX rewards received from
        stacking the city treasury's STX.
      </Text>
      <Alert status="info" variant="left-accent">
        <Box>
          <AlertTitle fontSize="xl" mb={4}>
            Please note:
          </AlertTitle>
          <AlertDescription>
            <UnorderedList>
              <ListItem>
                CityCoins are transferred to the contract while Stacking
              </ListItem>
              <ListItem>
                STX rewards can be claimed after each cycle ends
              </ListItem>
              <ListItem>
                Stacked CityCoins can be claimed after the selected period ends
              </ListItem>
              <ListItem>
                Stacking always occurs in the next reward cycle
              </ListItem>
              <ListItem>
                Stackers must skip one cycle after stacking ends
              </ListItem>
            </UnorderedList>
          </AlertDescription>
        </Box>
      </Alert>
      <StackingForm />
    </Stack>
  );
}

export default Stacking;
