import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  ListItem,
  Spacer,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { FaQuestion } from "react-icons/fa";

const consentCheckedAtom = atom(false);

function StackingForm() {
  const [consentChecked, setConsentChecked] = useAtom(consentCheckedAtom);
  return (
    <form id="stacking">
      <Stack spacing={8}>
        <Heading as="h3" size="lg">
          Stack XX in cycle XX
        </Heading>
        <Stack direction="row" alignItems="center">
          <InputGroup>
            <FormControl>
              <Input type="number" min="1" placeholder="Amount in XX" />
            </FormControl>
            <InputRightAddon>XX</InputRightAddon>
            <Button>MAX</Button>
          </InputGroup>
        </Stack>
        <Input type="number" min="1" max="32" placeholder="Number of Cycles" />
        <FormControl>
          <Checkbox
            alignItems="flex-start"
            iconSize="2rem"
            isChecked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
          >
            <Stack>
              <Text>
                I confirm that by participating in stacking, I understand:
              </Text>
              <UnorderedList>
                <ListItem>
                  CityCoins are transferred to the contract while stacking
                </ListItem>
                <ListItem>
                  STX rewards can be claimed after each cycle ends
                </ListItem>
                <ListItem>
                  stacked CityCoins can be claimed after stacking ends
                </ListItem>
              </UnorderedList>
            </Stack>
          </Checkbox>
        </FormControl>
        <Button type="submit">Stack XX</Button>
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
      <Divider />
      <StackingForm />
    </Stack>
  );
}

export default Stacking;
