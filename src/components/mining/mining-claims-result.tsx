import { useAtomValue, useSetAtom } from "jotai";
import { useIsBlockWinner, useMinerStats } from "../../hooks/use-ccd006-v2";
import { currentCityInfoAtom } from "../../store/citycoins";
import {
  Button,
  Divider,
  GridItem,
  Heading,
  IconButton,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { miningClaimListAtom } from "../../store/ccd006-v2";
import { formatMicroAmount } from "../../store/common";

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const setMiningClaimList = useSetAtom(miningClaimListAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);

  if (!currentCityInfo) throw new Error("No current city info found");

  // const miningStats = useMiningStats(currentCityInfo.id, blockHeight);
  const minerStats = useMinerStats(currentCityInfo.id, blockHeight);
  const isBlockWinner = useIsBlockWinner(currentCityInfo.id, blockHeight);

  const handleRemoveBlock = () => {
    setMiningClaimList((prev) => prev.filter((b) => b !== blockHeight));
    // TODO: remove from related atom family
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
      {isBlockWinner.data ? (
        <>
          <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
            <Heading size="sm">Claimed</Heading>
            <Text>{isBlockWinner.data?.claimed.toString()}</Text>
          </GridItem>
          <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
            <Heading size="sm">Winner</Heading>
            <Text>{isBlockWinner.data?.winner.toString()}</Text>
          </GridItem>
          <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 5, md: 4 }}>
            <Heading size="sm">Commit</Heading>
            <Text>
              {minerStats.data && formatMicroAmount(minerStats.data?.commit)}
            </Text>
          </GridItem>
        </>
      ) : (
        <>
          <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
            <Text>No data</Text>
          </GridItem>
          <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
            <Text>No data</Text>
          </GridItem>
          <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 5, md: 4 }}>
            <Text>No data</Text>
          </GridItem>
        </>
      )}
      {/* Claim Button */}
      <GridItem
        colSpan={{ base: 1, md: 1 }}
        order={{ base: 6, md: 5 }}
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
      <GridItem colSpan={{ base: 3, md: 6 }}>
        <Divider orientation="horizontal" />
      </GridItem>
    </SimpleGrid>
  );
}

export default MiningClaimResult;
