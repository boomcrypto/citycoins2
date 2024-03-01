import { atom, useAtom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import {
  Button,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import MiningClaimResult from "./mining-claims-result";
import { blockHeightsAtom } from "../../store/stacks";
import { REWARD_DELAY } from "../../store/citycoins";
import { miningClaimListAtom } from "../../store/ccd006-v2";
import { memo, useEffect, useMemo } from "react";

type BlockSelection = "single" | "multiple";

const blockSelectionAtom = atom<BlockSelection>("single");

// either get computed value or set to user input
const startBlockHeightAtom = atomWithDefault(
  // getter no longer tracks dep when set
  // can be reset to default value with RESET
  (get) => {
    const blockHeight = get(blockHeightsAtom);
    return blockHeight ? blockHeight.stx - REWARD_DELAY * 3 : 0;
  }
);

const endBlockHeightAtom = atomWithDefault(
  // getter no longer tracks dep when set
  // can be reset to default value with RESET
  (get) => {
    const blockHeight = get(blockHeightsAtom);
    return blockHeight ? blockHeight.stx - REWARD_DELAY : 0;
  }
);

function MiningClaimsForm() {
  const [blockSelection, setBlockSelection] = useAtom(blockSelectionAtom);
  const [miningClaimList, setMiningClaimList] = useAtom(miningClaimListAtom);
  const [startBlockHeight, setStartBlockHeight] = useAtom(startBlockHeightAtom);
  const [endBlockHeight, setEndBlockHeight] = useAtom(endBlockHeightAtom);

  function handleClearMiningClaimBlocks() {
    setMiningClaimList([]);
  }

  function handleMiningClaimBlocks() {
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

  const memoizedMiningClaimList = useMemo(
    () => miningClaimList,
    [miningClaimList]
  );

  const MemoizedMiningClaimResult = memo(MiningClaimResult);

  useEffect(() => {
    console.log("MiningClaimsForm: rendered");
  });

  return (
    <Stack spacing={4}>
      <Stack spacing={4} direction="row" alignItems="center">
        <RadioGroup
          name="blockSelectionRadio"
          onChange={(value) => {
            if (value === "single" || value === "multiple") {
              setBlockSelection(value);
            }
          }}
          value={blockSelection}
        >
          <Stack direction="row">
            <Radio value="single">Single</Radio>
            <Radio value="multiple">Multiple</Radio>
          </Stack>
        </RadioGroup>
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
      </Stack>
      <Stack direction={["column", null, "row"]} flexGrow="1">
        <Button w="100%" mb={4} onClick={handleMiningClaimBlocks}>
          Search for mining claims
        </Button>
        <Button w="100%" onClick={handleClearMiningClaimBlocks}>
          Clear all blocks
        </Button>
      </Stack>
      {memoizedMiningClaimList.length === 0 && (
        <Text>Mining claim list is empty.</Text>
      )}
      {memoizedMiningClaimList
        .sort((a, b) => a - b)
        .map((blockHeight) => (
          <MemoizedMiningClaimResult
            key={`miningclaim-block-${blockHeight}`}
            blockHeight={blockHeight}
          />
        ))}
    </Stack>
  );
}

export default MiningClaimsForm;
