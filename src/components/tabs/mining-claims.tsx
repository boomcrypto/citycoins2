import {
  Heading,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import {
  CityNames,
  miningBlocksToClaimPerCityAtom,
  miningClaimTransactionsAtom,
  miningTransactionsAtom,
} from "../../store/citycoins";
import { useAtomValue } from "jotai";

function MiningClaims() {
  const miningTxs = useAtomValue(miningTransactionsAtom);
  const miningClaimTxs = useAtomValue(miningClaimTransactionsAtom);
  const { miaBlockHeights, nycBlockHeights } = useAtomValue(
    miningBlocksToClaimPerCityAtom
  );
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Mining Claims</Heading>
      <Stack
        direction={["column", null, "row"]}
        justifyContent="space-between"
        spacing={2}
      >
        <Stat>
          <StatLabel>Mining TXs</StatLabel>
          <StatNumber>{miningTxs.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Mining Claim TXs</StatLabel>
          <StatNumber>{miningClaimTxs.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>MIA Blocks to Claim</StatLabel>
          <StatNumber>{miaBlockHeights.length}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>NYC Blocks to Claim</StatLabel>
          <StatNumber>{nycBlockHeights.length}</StatNumber>
        </Stat>
      </Stack>
      <MiningClaimsList city="mia" blockHeights={miaBlockHeights} />
      <MiningClaimsList city="nyc" blockHeights={nycBlockHeights} />
    </Stack>
  );
}

interface MiningClaimsListProps {
  city: CityNames;
  blockHeights: number[];
}

function MiningClaimsList({ city, blockHeights }: MiningClaimsListProps) {
  return (
    <Stack>
      <Text fontWeight="bold" size="lg">
        {city.toUpperCase()}
      </Text>
      <Stack>
        {blockHeights.map((blockHeight) => (
          <Text key={`${city}-${blockHeight}`}>{blockHeight}</Text>
        ))}
      </Stack>
    </Stack>
  );
}

export default MiningClaims;
