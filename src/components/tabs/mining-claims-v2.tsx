import { FaQuestion, FaTimes } from "react-icons/fa";
import { PrimitiveAtom, atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  atomFamily,
  atomWithDefault,
  atomWithStorage,
  loadable,
  splitAtom,
} from "jotai/utils";
import { blockHeightsAtom, stxAddressAtom } from "../../store/stacks";
import {
  REWARD_DELAY,
  currentCityInfoAtom,
  isCitySelectedAtom,
} from "../../store/citycoins";
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
  Skeleton,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import SignIn from "../auth/sign-in";
import { BiRefresh } from "react-icons/bi";
import { memo, useEffect, useMemo } from "react";
import { CC_API, extractLoadableState, fetchJson } from "../../store/common";

// helper function for getting block winner
export async function isBlockWinner(
  address: string,
  cityId: number,
  blockHeight: number
): Promise<BlockWinner> {
  const url = new URL("ccd006-citycoin-mining-v2/is-block-winner", CC_API);
  url.searchParams.set("user", address);
  url.searchParams.set("cityId", String(cityId));
  url.searchParams.set("claimHeight", String(blockHeight));
  try {
    const isWinner = await fetchJson<BlockWinner>(url.toString());
    isWinner.local = false;
    return isWinner;
  } catch (error) {
    throw new Error(
      `isBlockWinner: Failed to fetch data for block ${blockHeight}. Error: ${String(
        error
      )}`
    );
  }
}

// structure for radio buttons
type BlockSelection = "single" | "multiple";
const blockSelectionAtom = atom<BlockSelection>("single");

// structure for start/end block in form
// atomWithDefault does not track dep when set
const startBlockHeightAtom = atomWithDefault((get) => {
  // return value 300 blocks in the past or 0
  const blockHeight = get(blockHeightsAtom);
  return blockHeight ? blockHeight.stx - REWARD_DELAY * 3 : 0;
});
const endBlockHeightAtom = atomWithDefault((get) => {
  // return value 100 blocks in the past or 0
  const blockHeight = get(blockHeightsAtom);
  return blockHeight ? blockHeight.stx - REWARD_DELAY : 0;
});

// persistent atom for list of mining claim blocks
const miningClaimListAtom = atomWithStorage<number[]>(
  "citycoins-cc-miningClaimList",
  []
);
// contains an atom for each item in the persistent list
// can use setter as dispatch for actions (see examples)
const miningClaimListAtomsAtom = splitAtom<number, number>(miningClaimListAtom);

// type to define response from fetch per mining claim block
type BlockWinner = {
  local: boolean;
  winner: boolean;
  claimed: boolean;
};

// type to define consistent parameters used in fetch
type ParamsAddressCityIdBlock = {
  address: string;
  cityId: number;
  blockHeight: number;
};

// persistent atom for fetched data per mining claim block
// returns a persisted atom for the provided params with caching
const localBlockWinnerAtomFamily = atomFamily(
  ({ address, cityId, blockHeight }: ParamsAddressCityIdBlock) =>
    atomWithStorage<BlockWinner | null>(
      `citycoins-miningClaims-claimList-${address}-${cityId}-${blockHeight}`,
      null
    )
);

// async atom for fetching data per mining claim block
// returns an async atom for the provided params with caching
const fetchBlockWinnerAtomFamily = atomFamily(
  ({ address, cityId, blockHeight }: ParamsAddressCityIdBlock) =>
    atom(
      // getter
      async () => await isBlockWinner(address, cityId, blockHeight)
    )
);

// derived atom that returns either local or fetched data
// as a promise so it can be passed as a loadable atom
// whether local data exists or not
const derivedBlockWinnerAtomFamily = atomFamily(
  ({ address, cityId, blockHeight }: ParamsAddressCityIdBlock) => {
    // async atom to hold local or fetched result
    const derivedAtom = atom(
      // getter
      async (get) => {
        const localData = get(
          localBlockWinnerAtomFamily({ address, cityId, blockHeight })
        );
        if (localData) {
          console.log("derivedBlockWinnerAtomFamily: using local data");
          return Promise.resolve(localData);
        }
        console.log("derivedBlockWinnerAtomFamily: fetching data");
        return get(
          fetchBlockWinnerAtomFamily({ address, cityId, blockHeight })
        );
      }
    );
    return derivedAtom;
  }
);

// hook atom that reads derived atom and returns consistent state
const useBlockWinnerAtomFamily = (params: ParamsAddressCityIdBlock) => {
  const blockWinnerAtom = useMemo(
    () => loadable(derivedBlockWinnerAtomFamily(params)),
    // () => loadable(localBlockWinnerAtomFamily(params)),
    [params]
  );
  const loadableDerivedAtom = useAtomValue(blockWinnerAtom);
  return extractLoadableState(loadableDerivedAtom);
};

function MiningClaimsV2() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const isCitySelected = useAtomValue(isCitySelectedAtom);
  // verify we have required data to access component
  if (!stxAddress) {
    return (
      <Stack>
        <Text>Please sign in with your wallet to continue.</Text>
        <SignIn />
      </Stack>
    );
  }
  if (!isCitySelected) {
    return <Text>Please select a city to continue.</Text>;
  }

  return (
    <Stack spacing={4}>
      <MiningClaimsIntro />
      <MiningClaimsForm />
      <MiningClaimsList />
    </Stack>
  );
}

export default MiningClaimsV2;

function MiningClaimsIntro() {
  const stxAddress = useAtomValue(stxAddressAtom);
  // this page does not render unless the STX address is set
  // and a city is selected, so we expect non-null values
  const address = stxAddress!;

  return (
    <Stack>
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
        <Link isExternal href={`https://explorer.hiro.so/address/${address}`}>
          Stacks Explorer
        </Link>{" "}
        to view previous mining transactions.
      </Text>
    </Stack>
  );
}

function MiningClaimsForm() {
  const [blockSelection, setBlockSelection] = useAtom(blockSelectionAtom);
  const [startBlockHeight, setStartBlockHeight] = useAtom(startBlockHeightAtom);
  const [endBlockHeight, setEndBlockHeight] = useAtom(endBlockHeightAtom);
  const setMiningClaimList = useSetAtom(miningClaimListAtom);

  // clears list of blocks
  function handleClearMiningClaimBlocks() {
    setMiningClaimList([]);
  }

  // updates list of blocks
  function handleMiningClaimBlocks() {
    if (blockSelection === "single") {
      setMiningClaimList((prev) => {
        const newList = Array.from(new Set([...prev, startBlockHeight]));
        return newList.sort((a, b) => a - b);
      });
    }
    if (blockSelection === "multiple") {
      if (endBlockHeight > startBlockHeight) {
        const blockRange = Array.from(
          { length: endBlockHeight - startBlockHeight + 1 },
          (_, i) => startBlockHeight + i
        );
        setMiningClaimList((prev) => {
          const newList = Array.from(new Set([...prev, ...blockRange]));
          return newList.sort((a, b) => a - b);
        });
      }
    }
  }

  return (
    <Stack>
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
        {blockSelection === "multiple" && (
          <Input
            placeholder="end block height"
            value={endBlockHeight}
            onChange={(e) => setEndBlockHeight(Number(e.target.value))}
          />
        )}
      </Stack>
      <Stack direction={["column", null, "row"]} flexGrow="1">
        <Button w="100%" mb={4} onClick={handleMiningClaimBlocks}>
          Search for mining claims
        </Button>
        <Button w="100%" onClick={handleClearMiningClaimBlocks}>
          Clear all blocks
        </Button>
      </Stack>
      <Divider orientation="horizontal" />
    </Stack>
  );
}

function MiningClaimsList() {
  // get the list to check if it's empty
  const miningClaimList = useAtomValue(miningClaimListAtom);
  // get an atom that represents each block on the list
  const [miningClaimListAtoms, dispatch] = useAtom(miningClaimListAtomsAtom);

  if (miningClaimList.length === 0) {
    return <Text>Mining claim list is empty.</Text>;
  }

  return (
    <SimpleGrid
      templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(5, 1fr)" }}
      spacingX="2em"
      spacingY="2em"
      alignItems="center"
      alignContent="center"
    >
      {miningClaimListAtoms.map((miningClaimListAtom) => (
        <MiningClaimResultMemoized
          key={`${miningClaimListAtom}`}
          miningClaimListAtom={miningClaimListAtom}
          remove={() => dispatch({ type: "remove", atom: miningClaimListAtom })}
        />
      ))}
    </SimpleGrid>
  );
}

// atomFamily for localStorage
// if not in localStorage, fetch atom

// atomFamily for async fetch atom
// way to log if running already?
// hook to access loading state

// receives an atom per block and the option to remove it
function MiningClaimResult({
  miningClaimListAtom,
  remove,
}: {
  miningClaimListAtom: PrimitiveAtom<number>;
  remove: () => void;
}) {
  const stxAddress = useAtomValue(stxAddressAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);
  const miningClaimBlock = useAtomValue(miningClaimListAtom);

  // this page does not render unless the STX address is set
  // and a city is selected, so we expect non-null values
  const address = stxAddress!;
  const cityId = currentCityInfo!.id;

  // memoize the params
  const params = useMemo(
    () => ({
      address,
      cityId,
      blockHeight: miningClaimBlock,
    }),
    [address, cityId, miningClaimBlock]
  );

  // hook for interacting with loading state of atom
  const blockWinner = useBlockWinnerAtomFamily(params);
  const setLocalBlockWinner = useSetAtom(localBlockWinnerAtomFamily(params));
  const blockWinnerData = blockWinner.data;

  // side effect to set local data if not already set
  useEffect(() => {
    console.log("MiningClaimResult: setting local data");
    if (blockWinnerData && !blockWinnerData.local) {
      setLocalBlockWinner(blockWinnerData);
    }
  }, [blockWinnerData, setLocalBlockWinner]);

  return (
    <>
      <GridItem colSpan={5}>
        <Text>Debug: {JSON.stringify(blockWinner)}</Text>
      </GridItem>
      {/* Header */}
      <GridItem>
        <Heading size="lg">{miningClaimBlock}</Heading>
      </GridItem>
      {/* Column Contents */}
      <GridItem>
        <Heading size="sm">Claimed</Heading>
        <Skeleton isLoaded={blockWinner.hasData || blockWinner.hasError}>
          <Text>
            {blockWinnerData
              ? blockWinnerData.claimed.toString()
              : "Loading..."}
          </Text>
        </Skeleton>
      </GridItem>
      <GridItem>
        <Heading size="sm">Winner</Heading>
        <Skeleton isLoaded={blockWinner.hasData}>
          <Text>
            {blockWinnerData ? blockWinnerData.winner.toString() : "Loading..."}
          </Text>
        </Skeleton>
      </GridItem>
      {/* Claim Button */}
      <GridItem textAlign="right">
        <Skeleton isLoaded={blockWinner.hasData}>
          <Button w="100%">Claim</Button>
        </Skeleton>
      </GridItem>

      {/* Action Buttons */}
      <GridItem textAlign="right">
        <IconButton
          mr={3}
          aria-label="Refresh mining claim data"
          title="Refresh mining claim data"
          icon={<BiRefresh />}
        />
        <IconButton
          aria-label="Remove"
          title="Remove"
          icon={<FaTimes />}
          onClick={remove}
        />
      </GridItem>
      {/* Divider */}
      <GridItem colSpan={{ base: 1, md: 5 }}>
        <Divider orientation="horizontal" />
      </GridItem>
    </>
  );
}

// component is memoized with React.memo, should only change if the
// rovided atom changes, eliminating multiple fetches
// use this when rendering instead of the component directly
const MiningClaimResultMemoized = memo(MiningClaimResult);
