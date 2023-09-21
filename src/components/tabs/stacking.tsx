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
  useToast,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { FaQuestion } from "react-icons/fa";

// NEED
// current reward cycle
// current user's balance
// city token symbol

const amountToStackAtom = atom(0);
const numberOfCyclesAtom = atom(0);
const consentCheckedAtom = atom(false);

function StackingForm() {
  const [amountToStack, setAmountToStack] = useAtom(amountToStackAtom);
  const [numberOfCycles, setNumberOfCycles] = useAtom(numberOfCyclesAtom);
  const [consentChecked, setConsentChecked] = useAtom(consentCheckedAtom);
  const toast = useToast();

  function handleAmountToStack(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value === "") {
      setAmountToStack(0);
      return;
    }
    let parsedValue = Number(e.target.value.trim());
    if (isNaN(parsedValue) || parsedValue < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter a number greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setAmountToStack(0);
      return;
    }
    setAmountToStack(parsedValue);
  }

  function handleNumberOfCycles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value === "") {
      setNumberOfCycles(0);
      return;
    }
    let parsedValue = Number(e.target.value.trim());
    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 32) {
      toast({
        title: "Invalid number of cycles",
        description: "Please enter a number between 1 and 32",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setNumberOfCycles(0);
      return;
    }
    setNumberOfCycles(parsedValue);
  }

  function handleSubmit(e: React.FormEvent<HTMLButtonElement>) {
    // e.preventDefault();
    const isValid = isValidSubmission();
    console.log(isValid);
    if (!isValid) {
      return;
    }
    console.log("amountToStack", amountToStack);
    console.log("numberOfCycles", numberOfCycles);
    // TODO: make contract call (hook?)
    //   onCancel: toast warning
    //   onFinish: toast success
    // TODO: component to show tx info
    // txInfo && <TxInfo txInfo={txInfo} />
  }

  function isValidSubmission() {
    // check if number of cycles is > 0 and <= 32
    if (numberOfCycles <= 0 || numberOfCycles > 32) {
      toast({
        title: "Invalid number of cycles",
        description: "Please enter a number between 1 and 32",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // check if amount to stack is > 0
    if (amountToStack <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a number greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // check if consent is checked
    if (!consentChecked) {
      toast({
        title: "Consent not checked",
        description: "Please check the consent box",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // TODO: check that user balances are loaded
    // TODO: check that user has enough CityCoins to stack
    // TODO: check that user has enough balance for tx + fee
    return true;
  }

  return (
    <form id="stacking">
      <Stack spacing={8}>
        <Heading as="h3" size="lg">
          Stack XX in cycle XX
        </Heading>
        <Stack direction="row" alignItems="center">
          <InputGroup>
            <FormControl>
              <Input
                type="number"
                min="1"
                placeholder="Amount in XX"
                onChange={(e) => handleAmountToStack(e)}
              />
            </FormControl>
            <InputRightAddon>XX</InputRightAddon>
            <Button>MAX</Button>
          </InputGroup>
        </Stack>
        <Input
          type="number"
          min="1"
          max="32"
          placeholder="Number of Cycles"
          onChange={(e) => handleNumberOfCycles(e)}
        />
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
        <Button isDisabled={!consentChecked} onClick={(e) => handleSubmit(e)}>
          Stack XX
        </Button>
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
