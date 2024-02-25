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
import { useIsBlockWinner } from "../../hooks/use-ccd006-v2";
import { currentCityInfoAtom } from "../../store/citycoins";
import {
  miningClaimListAtom,
  isBlockWinnerMapAtom,
} from "../../store/ccd006-v2";
import { useEffect, useMemo } from "react";

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const toast = useToast();
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setMiningClaimList = useSetAtom(miningClaimListAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);

  // should be unreachable
  if (!currentCityInfo) throw new Error("No current city info found");

  // const miningStats = useMiningStats(currentCityInfo.id, blockHeight);
  // const minerStats = useMinerStats(currentCityInfo.id, blockHeight);
  // const isBlockWinnerValue = useIsBlockWinner(currentCityInfo.id, blockHeight);

  useEffect(() => {
    console.log("MiningClaimResult mounted or updated", blockHeight);

    return () => {
      console.log("MiningClaimResult will unmount or update");
    };
  });

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
          aria-label="Remove"
          title="Remove"
          icon={<FaTimes />}
          onClick={handleRemoveBlock}
        />
      </GridItem>
      {/* Column Contents */}
      <MiningClaimResultData blockHeight={blockHeight} />
      <GridItem colSpan={{ base: 3, md: 5 }}>
        <Divider orientation="horizontal" />
      </GridItem>
    </SimpleGrid>
  );
}

function MiningClaimResultData({ blockHeight }: { blockHeight: number }) {
  const currentCityInfo = useAtomValue(currentCityInfoAtom);
  if (!currentCityInfo) throw new Error("No current city info found");
  const cityId = useMemo(() => currentCityInfo?.id, [currentCityInfo?.id]);
  const isBlockWinnerValue = useIsBlockWinner(cityId, blockHeight);
  const isBlockWinnerValueData = isBlockWinnerValue.data;
  const [isBlockWinnerMap, setIsBlockWinnerMap] = useAtom(isBlockWinnerMapAtom);
  const blockWinnerData = isBlockWinnerMap.get(blockHeight);

  useEffect(() => {
    console.log("MiningClaimResultData mounted or updated", { blockHeight });

    return () => {
      console.log("MiningClaimResultData will unmount or update");
    };
  });

  // do I need the hook at this point
  // or do I just fetch and set the data?
  // what about fetching a second time?
  useEffect(() => {
    if (isBlockWinnerValueData) {
      setIsBlockWinnerMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(blockHeight, isBlockWinnerValueData);
        return newMap;
      });
    }
  }, [isBlockWinnerValueData, blockHeight, setIsBlockWinnerMap]);

  if (blockWinnerData) {
    return (
      <>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
          <Heading size="sm">Claimed</Heading>
          <Text>{blockWinnerData.claimed.toString()}</Text>
        </GridItem>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
          <Heading size="sm">Winner</Heading>
          <Text>{blockWinnerData.winner.toString()}</Text>
        </GridItem>
        {/* Claim Button */}
        <GridItem
          colSpan={{ base: 1, md: 1 }}
          order={{ base: 6, md: 4 }}
          textAlign="right"
        >
          <Button
            w="100%"
            isDisabled={blockWinnerData.claimed || !blockWinnerData.winner}
          >
            Claim
          </Button>
        </GridItem>
      </>
    );
  }

  if (isBlockWinnerValue.isLoading) {
    return (
      <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
        <Spinner label="Loading winner data..." />
      </GridItem>
    );
  }

  return (
    <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
      Unable to fetch data, please refresh.
    </GridItem>
  );
}

export default MiningClaimResult;
