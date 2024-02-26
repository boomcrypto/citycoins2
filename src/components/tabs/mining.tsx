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
import { useOpenContractCall } from "@micro-stacks/react";
import { FinishedTxData } from "micro-stacks/connect";
import { stringAsciiCV, listCV, uintCV } from "micro-stacks/clarity";
import {
  FungibleConditionCode,
  makeStandardSTXPostCondition,
} from "micro-stacks/transactions";
import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { FaQuestion } from "react-icons/fa";
import {
  MICRO_STX,
  blockHeightsAtom,
  stxAddressAtom,
} from "../../store/stacks";
import TxInfo from "../stacks/tx-info";
import {
  currentCityConfigAtom,
  currentCityInfoAtom,
  isCitySelectedAtom,
} from "../../store/citycoins";

const numberOfBlocksAtom = atom(0);
const useSameAmountAtom = atom(false);
const blockValuesAtom = atomWithDefault<number[]>((get) => {
  const numberOfBlocks = get(numberOfBlocksAtom);
  return new Array(numberOfBlocks).fill(0);
});
const finalBlockValuesAtom = atom<number[]>((get) => {
  const blockValues = get(blockValuesAtom);
  const useSameAmount = get(useSameAmountAtom);
  if (useSameAmount && blockValues.length > 0) {
    const firstValue = blockValues[0];
    return Array(blockValues.length).fill(firstValue);
  }
  return blockValues;
});
const sumFinalBlockValuesAtom = atom<number>((get) => {
  const finalBlockValues = get(finalBlockValuesAtom);
  return finalBlockValues.reduce((acc, val) => acc + val, 0);
});
const consentCheckedAtom = atom(false);
const txDataAtom = atom<FinishedTxData | null>(null);

function MiningForm() {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const blockHeights = useAtomValue(blockHeightsAtom);
  const stxAddress = useAtomValue(stxAddressAtom);
  const isCitySelected = useAtomValue(isCitySelectedAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);
  const currentCityConfig = useAtomValue(currentCityConfigAtom);
  const [numberOfBlocks, setNumberOfBlocks] = useAtom(numberOfBlocksAtom);
  const [useSameAmount, setUseSameAmount] = useAtom(useSameAmountAtom);
  const [blockValues, setBlockValues] = useAtom(blockValuesAtom);
  const [finalBlockValues] = useAtom(finalBlockValuesAtom);
  const [sumFinalBlockValues] = useAtom(sumFinalBlockValuesAtom);
  const [consentChecked, setConsentChecked] = useAtom(consentCheckedAtom);
  const [txData, setTxData] = useAtom(txDataAtom);
  const toast = useToast();

  function handleNumberOfBlocks(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value === "") {
      setNumberOfBlocks(0);
      return;
    }
    let parsedValue = Math.floor(Number(e.target.value.trim()));
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

  async function handleSubmit() {
    const isValid = isValidSubmission();
    console.log("isValid", isValid);
    if (!isValid) {
      return;
    }
    const microStxFinalValues = finalBlockValues.map((val) =>
      Math.floor(parseFloat(val.toFixed(6)) * MICRO_STX)
    );
    const sumMicroStxFinalvalues = microStxFinalValues.reduce(
      (acc, val) => acc + val,
      0
    );
    const postConditions = [
      makeStandardSTXPostCondition(
        stxAddress!,
        FungibleConditionCode.Equal,
        sumMicroStxFinalvalues
      ),
    ];
    try {
      await openContractCall({
        contractAddress: currentCityConfig!.daoV2.mining.deployer,
        contractName: currentCityConfig!.daoV2.mining.contractName,
        functionName: currentCityConfig!.daoV2.mining.miningFunction,
        functionArgs: [
          stringAsciiCV(currentCityInfo!.name),
          listCV(microStxFinalValues.map((val) => uintCV(val))),
        ],
        postConditions: postConditions,
        onCancel: () => {
          toast({
            title: "Canceled",
            description: "Mining transaction cancelled",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        },
        onFinish: async (data) => {
          toast({
            title: "Success",
            description: "Mining transaction successful",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          setTxData(data);
        },
      });
    } catch (error) {
      toast({
        title: "Error sending transaction",
        description: String(error),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  function isValidSubmission() {
    if (!blockHeights) {
      toast({
        title: "Block heights not loaded",
        description: "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // TODO: derived atom for if currently mining
    // check if number of blocks is > 0 and <= 200
    if (numberOfBlocks <= 0 || numberOfBlocks > 200) {
      toast({
        title: "Invalid number of blocks",
        description: "Please enter a number between 1 and 200",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // check that each block value is > 0
    if (finalBlockValues.some((val) => val <= 0)) {
      toast({
        title: "Invalid block value",
        description: "Amount per block must be greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // check that consent is checked
    if (!consentChecked) {
      toast({
        title: "Consent not checked",
        description: "Please check the consent box to continue",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    // TODO: check that user balances are loaded
    // TODO: check that user has enough balance for tx + fee
    return true;
  }

  if (!isCitySelected) {
    return <Text>Please select a city to continue.</Text>;
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
              {sumFinalBlockValues.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}{" "}
              STX
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
                    {/* show text below for NYC */}
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
              isDisabled={!consentChecked}
              isLoading={isRequestPending}
              onClick={handleSubmit}
            >
              Mine for{" "}
              {numberOfBlocks === 1 ? "1 block" : `${numberOfBlocks} blocks`}
            </Button>
          </Stack>
        )}
      </Stack>
      {txData && <TxInfo txData={txData} />}
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
