import { useAtomValue, useSetAtom } from "jotai";
import { useMiningStats, useMinerStats } from "../../hooks/use-mining-stats";
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

function MiningClaimResult({ blockHeight }: { blockHeight: number }) {
  const setMiningClaimList = useSetAtom(miningClaimListAtom);
  const currentCityInfo = useAtomValue(currentCityInfoAtom);

  if (!currentCityInfo) throw new Error("No current city info found");

  const miningStats = useMiningStats(currentCityInfo.id, blockHeight);
  //const minerStats = useMinerStats(currentCityInfo.id, blockHeight);

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
      <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 3, md: 2 }}>
        <Text>
          Claimed: {miningStats.hasData && miningStats.data?.claimed.toString()}
        </Text>
      </GridItem>
      <GridItem colSpan={{ base: 3, md: 1 }} order={{ base: 4, md: 3 }}>
        <Text>Miners: {miningStats.hasData && miningStats.data?.miners}</Text>
      </GridItem>
      <GridItem colSpan={{ base: 2, md: 1 }} order={{ base: 5, md: 4 }}>
        <Text>Commit: </Text>
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

export default MiningClaimResult;
