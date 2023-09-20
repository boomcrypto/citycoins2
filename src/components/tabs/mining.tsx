import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  Heading,
  IconButton,
  Input,
  ListItem,
  SimpleGrid,
  Spacer,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { FaQuestion } from "react-icons/fa";

// NEED
// current block height
// current user's balance

const numberOfBlocksAtom = atom(0);
const useSameAmountAtom = atom(false);
const blockValuesAtom = atomWithDefault((get) => {
  const numberOfBlocks = get(numberOfBlocksAtom);
  return new Array(numberOfBlocks).fill(0);
});
const finalBlockValuesAtom = atom((get) => {
  const blockValues = get(blockValuesAtom);
  const useSameAmount = get(useSameAmountAtom);

  if (useSameAmount && blockValues.length > 0) {
    const firstValue = blockValues[0];
    return Array(blockValues.length).fill(firstValue);
  }

  return blockValues;
});
const consentCheckedAtom = atom(false);

function MiningForm() {
  const [numberOfBlocks, setNumberOfBlocks] = useAtom(numberOfBlocksAtom);
  const [useSameAmount, setUseSameAmount] = useAtom(useSameAmountAtom);
  const [blockValues, setBlockValues] = useAtom(blockValuesAtom);
  const [finalBlockValues] = useAtom(finalBlockValuesAtom);
  const [consentChecked, setConsentChecked] = useAtom(consentCheckedAtom);
  const toast = useToast();

  function handleNumberOfBlocks(e: React.ChangeEvent<HTMLInputElement>) {
    let parsedValue = Number(e.target.value.trim());

    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 200) {
      toast({
        title: "Invalid number of blocks",
        description: "Please enter a number between 1 and 200",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setNumberOfBlocks(0);
      return;
    }

    setNumberOfBlocks(parsedValue);
    setBlockValues(new Array(parsedValue).fill(0));
  }

  function handleBlockValueChange(index: number, value: string) {
    const newValue = Number(value.trim());

    if (newValue <= 0 || isNaN(newValue)) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (useSameAmount) {
      setBlockValues(new Array(blockValues.length).fill(newValue));
    } else {
      const newValues = [...blockValues];
      newValues[index] = newValue;
      setBlockValues(newValues);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    console.log("submit");
  }

  return (
    <form id="mining">
      <Stack spacing={8}>
        <FormControl>
          <Input
            type="number"
            min="1"
            max="200"
            placeholder="Number of Blocks to mine?"
            onChange={(e) => handleNumberOfBlocks(e)}
            mb={2}
          />
          <Checkbox
            isChecked={useSameAmount}
            onChange={(e) => setUseSameAmount(e.target.checked)}
          >
            Use same amount for all blocks
          </Checkbox>
        </FormControl>
        <Stack direction="row" textAlign="center">
          <Stat>
            <StatLabel>Number of Blocks</StatLabel>
            <StatNumber>{numberOfBlocks}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Amount</StatLabel>
            <StatNumber>
              {finalBlockValues.reduce((acc, val) => acc + val, 0)} STX
            </StatNumber>
          </Stat>
        </Stack>
        <Divider />
        {numberOfBlocks > 0 && (
          <Stack spacing={8}>
            <SimpleGrid columns={[1, null, 10]} minChildWidth={100} spacing={5}>
              {Array.from({ length: numberOfBlocks }, (_, i) => i + 1).map(
                (block, index) => (
                  <FormControl key={`mining-${block}`}>
                    <Input
                      type="number"
                      min="1"
                      placeholder={`Block ${block}`}
                      value={finalBlockValues[index] || ""}
                      onChange={(e) =>
                        handleBlockValueChange(index, e.target.value)
                      }
                    />
                  </FormControl>
                )
              )}
            </SimpleGrid>
            <FormControl>
              <Checkbox
                alignItems="flex-start"
                iconSize="2rem"
                isChecked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              >
                <Stack>
                  <Text>
                    I confirm that by participating in mining, I understand:
                  </Text>
                  <UnorderedList>
                    <ListItem>
                      the city has not claimed the protocol contribution
                    </ListItem>
                    <ListItem>
                      participation does not guarantee winning the rights to
                      claim newly minted CityCoins
                    </ListItem>
                    <ListItem>
                      once STX are sent to the contract, they are not returned
                    </ListItem>
                  </UnorderedList>
                </Stack>
              </Checkbox>
            </FormControl>
            <Button
              type="submit"
              isDisabled={!consentChecked}
              onSubmit={handleSubmit}
            >
              Mine for{" "}
              {numberOfBlocks === 1 ? "1 block" : `${numberOfBlocks} blocks`}
            </Button>
          </Stack>
        )}
      </Stack>
    </form>
  );
}

function Mining() {
  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="space-betwen">
        <Heading>CityCoins Mining</Heading>
        <Spacer />
        <IconButton
          aria-label="Mining Info"
          title="Mining Info"
          icon={<FaQuestion />}
          as="a"
          href="https://docs.citycoins.co/core-protocol/mining-citycoins"
          target="_blank"
          rel="noopener noreferrer"
        />
      </Stack>
      <Text>
        Mining is done by competing with other miners in a Stacks block. You can
        only mine once per block.
      </Text>
      <Text>
        One winner is selected randomly, weighted by how much the miner commits
        against the total committed that block.
      </Text>
      <MiningForm />
    </Stack>
  );
}

export default Mining;
