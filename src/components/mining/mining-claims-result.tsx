import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Button,
  Divider,
  GridItem,
  Heading,
  IconButton,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useOpenContractCall } from "@micro-stacks/react";
import { FaTimes } from "react-icons/fa";
import { currentCityInfoAtom } from "../../store/citycoins";
import {
  ParamsAddressCityBlock,
  derivedIsBlockWinnerAtomFamily,
  localBlockWinnerAtomFamily,
  miningClaimListAtom,
} from "../../store/ccd006-v2";
import { useEffect } from "react";
import { stxAddressAtom } from "../../store/stacks";
import { loadable } from "jotai/utils";
import { extractLoadableState } from "../../store/common";
import { BiRefresh } from "react-icons/bi";

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const toast = useToast();
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setMiningClaimList = useSetAtom(miningClaimListAtom);
  const address = useAtomValue(stxAddressAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);

  // should be unreachable
  if (!address) throw new Error("No address found");
  if (!currentCityInfo) throw new Error("No current city info found");

  const handleRemoveBlock = () => {
    setMiningClaimList((prev) => prev.filter((b) => b !== blockHeight));
    // TODO: remove from related atom family
  };

  /*
  const handleMiningClaimTx = async (blockHeight: number) => {
    if (!currentCityConfig) return null;
    try {
      await openContractCall({
        contractAddress: currentCityConfig.contractAddress,
        contractName: currentCityConfig.contractName,
        functionName: "claim-mining-reward",
        functionArgs: [uintCV(blockHeight)],
        postConditions: [],
      });
    } catch (error) {
      toast({
        title: "Error sending transaction",
        description: String(error),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
  };
  */

  return (
    <SimpleGrid
      key={`claimBlock-${blockHeight}`}
      templateColumns={{ base: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }}
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
        colStart={{ md: 5 }}
        order={{ base: 2, md: 5 }}
        textAlign="right"
      >
        <IconButton
          mr={3}
          aria-label="Refresh mining claim data"
          title="Refresh mining claim data"
          icon={<BiRefresh />}
          /*
            ref={refreshBlockHeights}
            onClick={() => {
              triggerSpin(refreshBlockHeights);
              fetchBlockHeights();
            }}
            */
        />
        <IconButton
          aria-label="Remove"
          title="Remove"
          icon={<FaTimes />}
          onClick={handleRemoveBlock}
        />
      </GridItem>
      {/* Column Contents */}
      <MiningClaimResultData
        address={address}
        cityId={currentCityInfo.id}
        blockHeight={blockHeight}
      />
      <GridItem colSpan={{ base: 3, md: 5 }}>
        <Divider orientation="horizontal" />
      </GridItem>
    </SimpleGrid>
  );
}

function MiningClaimResultData(props: ParamsAddressCityBlock) {
  // gets from local storage or fetches from the network
  const isBlockWinnerData = useAtomValue(
    loadable(derivedIsBlockWinnerAtomFamily(props))
  );
  // state of data for component responses
  const { isLoading, hasData, data } = extractLoadableState(isBlockWinnerData);
  // value of local data to see if set
  const [localBlockWinnerData, setIsBlockWinnerData] = useAtom(
    localBlockWinnerAtomFamily(props)
  );

  /*
  const setIsBlockWinnerData = useSetAtom(
    derivedIsBlockWinnerAtomFamily(props)
  );
  */

  useEffect(() => {
    if (data) {
      console.log("MiningClaimResultData: setting value in localstorage");
      setIsBlockWinnerData(data);
    }
  }, [localBlockWinnerData, data, setIsBlockWinnerData]);

  if (isLoading) {
    return (
      <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
        <Spinner label="Loading winner data..." />
      </GridItem>
    );
  }

  if (hasData && data) {
    return (
      <>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
          <Heading size="sm">Claimed</Heading>
          <Text>{data.claimed.toString()}</Text>
        </GridItem>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
          <Heading size="sm">Winner</Heading>
          <Text>{data.winner.toString()}</Text>
        </GridItem>
        {/* Claim Button */}
        <GridItem
          colSpan={{ base: 1, md: 1 }}
          order={{ base: 6, md: 4 }}
          textAlign="right"
        >
          <Button w="100%" isDisabled={data.claimed || !data.winner}>
            Claim
          </Button>
        </GridItem>
      </>
    );
  }

  // error state by default
  return (
    <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
      Unable to fetch data, please refresh.
    </GridItem>
  );
}

export default MiningClaimResult;
