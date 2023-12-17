import {
  Button,
  GridItem,
  Heading,
  IconButton,
  Input,
  Link,
  Radio,
  RadioGroup,
  SimpleGrid,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { atom, useAtom, useSetAtom } from "jotai";
import { FaQuestion, FaTimes } from "react-icons/fa";

const blockSelectionAtom = atom("single");
const miningClaimListAtom = atom<number[]>([]);
const startBlockHeightAtom = atom(0);
const endBlockHeightAtom = atom(0);

function MiningClaimsForm() {
  const [blockSelection, setBlockSelection] = useAtom(blockSelectionAtom);
  const [miningClaimList, setMiningClaimList] = useAtom(miningClaimListAtom);
  const [startBlockHeight, setStartBlockHeight] = useAtom(startBlockHeightAtom);
  const [endBlockHeight, setEndBlockHeight] = useAtom(endBlockHeightAtom);

  function handleMiningClaim() {
    if (blockSelection === "single") {
      setMiningClaimList((prev) =>
        Array.from(new Set([...prev, startBlockHeight]))
      );
    }
    if (blockSelection === "multiple") {
      if (endBlockHeight > startBlockHeight) {
        const blockRange = Array.from(
          { length: endBlockHeight - startBlockHeight + 1 },
          (_, i) => startBlockHeight + i
        );
        setMiningClaimList((prev) =>
          Array.from(new Set([...prev, ...blockRange]))
        );
      }
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={4} direction="row" alignItems="center">
        <RadioGroup
          name="blockSelectionRadio"
          onChange={setBlockSelection}
          value={blockSelection}
        >
          <Stack direction="row">
            <Radio value="single">Single</Radio>
            <Radio value="multiple">Multiple</Radio>
          </Stack>
        </RadioGroup>
        {blockSelection === "single" && (
          <Input
            placeholder="block height"
            value={startBlockHeight}
            onChange={(e) => setStartBlockHeight(Number(e.target.value))}
          />
        )}
        {blockSelection === "multiple" && (
          <>
            <Input
              placeholder="start block height"
              value={startBlockHeight}
              onChange={(e) => setStartBlockHeight(Number(e.target.value))}
            />
            <Input
              placeholder="end block height"
              value={endBlockHeight}
              onChange={(e) => setEndBlockHeight(Number(e.target.value))}
            />
          </>
        )}
      </Stack>
      <Button onClick={handleMiningClaim}>Search for mining claims</Button>
      {miningClaimList.length === 0 && <Text>Mining claim list is empty.</Text>}
      {miningClaimList
        .sort((a, b) => a - b)
        .map((blockHeight) => (
          <MiningClaimResult
            key={`block-${blockHeight}`}
            blockHeight={blockHeight}
          />
        ))}
    </Stack>
  );
}

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const setMiningClaimList = useSetAtom(miningClaimListAtom);

  const handleRemoveBlock = () => {
    setMiningClaimList((prev) => prev.filter((b) => b !== blockHeight));
  };

  return (
    <SimpleGrid
      key={`block-${blockHeight}`}
      columns={6}
      spacingX="2em"
      spacingY="2em"
      alignItems="center"
    >
      <GridItem>
        <Heading>Block {blockHeight}</Heading>
      </GridItem>
      <GridItem>
        <Text>Col 1</Text>
      </GridItem>
      <GridItem>
        <Text>Col 2</Text>
      </GridItem>
      <GridItem>
        <Text>Col 3</Text>
      </GridItem>
      <GridItem>
        <Button>Claim</Button>
      </GridItem>
      <GridItem>
        <IconButton
          aria-label="Remove"
          title="Remove"
          icon={<FaTimes />}
          onClick={handleRemoveBlock}
        />
      </GridItem>
    </SimpleGrid>
  );
}

// MiningClaimResult
// uses code above as template
// takes block height as prop
// renders a grid with N columns
// queries and checks data
// displays status and claim button

function MiningClaims() {
  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="space-betwen">
        <Heading>CityCoins Mining Claims</Heading>
        <Spacer />
        <IconButton
          aria-label="Mining Claim Info"
          title="Mining Claim Info"
          icon={<FaQuestion />}
          as="a"
          href="https://docs.citycoins.co/core-protocol/mining-citycoins#claiming-rewards"
          target="_blank"
          rel="noopener noreferrer"
        />
      </Stack>
      <Text>
        Mining claims are based on the block height of the transaction, and a
        winner cannot be verified until 100 Stacks blocks pass from the block
        mined (~16 hours).
      </Text>
      <Text>
        Search for mining blocks to claim below. Each claim requires an
        individual transaction.
      </Text>
      <Text>
        Search for your address in the{" "}
        <Link isExternal href="https://explorer.hiro.so">
          Stacks Explorer
        </Link>{" "}
        to view previous mining transactions.
      </Text>
      <MiningClaimsForm />
    </Stack>
  );
}

export default MiningClaims;
