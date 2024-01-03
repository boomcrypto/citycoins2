import {
  Button,
  Divider,
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
import { atomWithStorage } from "jotai/utils";
import { FaQuestion, FaTimes } from "react-icons/fa";
import { blockHeightsAtom } from "../../store/stacks";
import { REWARD_DELAY } from "../../store/citycoins";

const blockSelectionAtom = atom("single");
const miningClaimListAtom = atomWithStorage<number[]>(
  "citycoins-cc-miningClaimList",
  []
);
const startBlockHeightAtom = atom(
  (get) => {
    const blockHeight = get(blockHeightsAtom);
    if (blockHeight) {
      return blockHeight.stx - REWARD_DELAY;
    }
    return 0;
  },
  (_, set, update) => {
    set(startBlockHeightAtom, update);
  }
);
const endBlockHeightAtom = atom(0);

function MiningClaimsForm() {
  const [blockSelection, setBlockSelection] = useAtom(blockSelectionAtom);
  const [miningClaimList, setMiningClaimList] = useAtom(miningClaimListAtom);
  const [startBlockHeight, setStartBlockHeight] = useAtom(startBlockHeightAtom);
  const [endBlockHeight, setEndBlockHeight] = useAtom(endBlockHeightAtom);

  function handleClearMiningClaims() {
    setMiningClaimList([]);
  }

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
      <Button mb={4} onClick={handleMiningClaim}>
        Search for mining claims
      </Button>
      <Button
        onClick={handleClearMiningClaims}
        display={{ base: "block", md: "none" }}
      >
        Clear all blocks
      </Button>
      <SimpleGrid
        templateColumns={{ base: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }}
        spacingX="2em"
        alignItems="center"
        display={{ base: "none", md: "grid" }}
      >
        {/* Header */}
        <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 1, md: 1 }}>
          <Heading size="lg">Block</Heading>
        </GridItem>
        {/* Close Button */}
        <GridItem
          colSpan={{ base: 1, md: 1 }}
          colStart={{ md: 6 }}
          order={{ base: 2, md: 6 }}
        ></GridItem>
        {/* Column Contents */}
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
          <Text fontWeight="bold">Col 1</Text>
        </GridItem>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
          <Text fontWeight="bold">Col 2</Text>
        </GridItem>
        <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 5, md: 4 }}>
          <Text fontWeight="bold">Col 3</Text>
        </GridItem>
        {/* Claim Button */}
        <GridItem colSpan={{ base: 1, md: 2 }} order={{ base: 6, md: 5 }}>
          <Button w="100%" onClick={handleClearMiningClaims}>
            Clear all blocks
          </Button>
        </GridItem>
      </SimpleGrid>
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
      key={`claimBlock-${blockHeight}`}
      templateColumns={{ base: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }}
      spacingX="2em"
      spacingY="2em"
      alignItems="center"
      alignContent="center"
    >
      {/* Header */}
      <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 1, md: 1 }}>
        <Heading size="lg">{blockHeight}</Heading>
      </GridItem>
      {/* Close Button */}
      <GridItem
        colSpan={{ base: 1, md: 1 }}
        colStart={{ md: 6 }}
        order={{ base: 2, md: 6 }}
        textAlign="right"
      >
        <IconButton
          aria-label="Remove"
          title="Remove"
          icon={<FaTimes />}
          onClick={handleRemoveBlock}
        />
      </GridItem>
      {/* Column Contents */}
      <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
        <Text>Col 1</Text>
      </GridItem>
      <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
        <Text>Col 2</Text>
      </GridItem>
      <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 5, md: 4 }}>
        <Text>Col 3</Text>
      </GridItem>
      {/* Claim Button */}
      <GridItem
        colSpan={{ base: 1, md: 1 }}
        order={{ base: 6, md: 5 }}
        textAlign="right"
      >
        <Button w="100%">Claim</Button>
      </GridItem>
      <GridItem colSpan={{ base: 3, md: 6 }}>
        <Divider orientation="horizontal" />
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
