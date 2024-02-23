import { useAtom } from "jotai";
import {
  blockSelectionAtom,
  endBlockHeightAtom,
  miningClaimListAtom,
  startBlockHeightAtom,
} from "../../store/citycoins-mining";
import {
  Button,
  GridItem,
  Heading,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import MiningClaimResult from "./mining-claims-result";

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

export default MiningClaimsForm;
