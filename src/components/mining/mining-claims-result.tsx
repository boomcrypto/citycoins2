import { useAtomValue, useSetAtom } from "jotai";
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
import { uintCV } from "micro-stacks/clarity";
import { FaTimes } from "react-icons/fa";
import { useIsBlockWinner } from "../../hooks/use-ccd006-v2";
import {
  currentCityConfigAtom,
  currentCityInfoAtom,
} from "../../store/citycoins";
import { miningClaimListAtom } from "../../store/ccd006-v2";

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const toast = useToast();
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setMiningClaimList = useSetAtom(miningClaimListAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);
  const currentCityConfig = useAtomValue(currentCityConfigAtom);

  if (!currentCityInfo) throw new Error("No current city info found");

  // const miningStats = useMiningStats(currentCityInfo.id, blockHeight);
  // const minerStats = useMinerStats(currentCityInfo.id, blockHeight);
  const isBlockWinner = useIsBlockWinner(currentCityInfo.id, blockHeight);

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
      {/* Claim Button */}
      <GridItem
        colSpan={{ base: 1, md: 1 }}
        order={{ base: 6, md: 4 }}
        textAlign="right"
      >
        <Button
          w="100%"
          isDisabled={
            !isBlockWinner.data ||
            isBlockWinner.data?.claimed ||
            !isBlockWinner.data?.winner
          }
        >
          Claim
        </Button>
      </GridItem>
      <GridItem colSpan={{ base: 3, md: 5 }}>
        <Divider orientation="horizontal" />
      </GridItem>
    </SimpleGrid>
  );
}

function MiningClaimResultData({ blockHeight }: { blockHeight: number }) {
  const currentCityInfo = useAtomValue(currentCityInfoAtom);

  if (!currentCityInfo) throw new Error("No current city info found");
  const isBlockWinner = useIsBlockWinner(currentCityInfo.id, blockHeight);

  if (isBlockWinner.isLoading) {
    return (
      <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
        <Spinner label="Loading winner data..." />
      </GridItem>
    );
  }

  if (isBlockWinner.hasError) {
    return (
      <GridItem colSpan={2} order={{ base: 3, md: 2 }}>
        Unable to fetch data...
      </GridItem>
    );
  }

  if (isBlockWinner.data) {
    return (
      <>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
          <Heading size="sm">Claimed</Heading>
          <Text>{isBlockWinner.data.claimed.toString()}</Text>
        </GridItem>
        <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
          <Heading size="sm">Winner</Heading>
          <Text>{isBlockWinner.data.winner.toString()}</Text>
        </GridItem>
      </>
    );
  }

  return <Text>No data available</Text>;
}

export default MiningClaimResult;
