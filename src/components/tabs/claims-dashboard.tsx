import {
  Accordion,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import {
  claimsSummaryAtom,
  miaUnclaimedMiningAtom,
  miaUnclaimedStackingAtom,
  nycUnclaimedMiningAtom,
  nycUnclaimedStackingAtom,
  MiningEntry,
  StackingEntry,
} from "../../store/claims";
import { CITY_INFO, getCityConfig } from "../../config/city-config";
import SignIn from "../auth/sign-in";

function shortenTxId(txId: string): string {
  if (!txId || txId.length < 16) return txId;
  return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
}

function formatStx(ustx: bigint): string {
  const stx = Number(ustx) / 1_000_000;
  return stx.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface MiningClaimTableProps {
  entries: MiningEntry[];
  city: "mia" | "nyc";
}

function MiningClaimTable({ entries, city }: MiningClaimTableProps) {
  if (entries.length === 0) {
    return (
      <Text color="fg.muted" py={4}>
        No unclaimed mining rewards found.
      </Text>
    );
  }

  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Block</Table.ColumnHeader>
          <Table.ColumnHeader>Version</Table.ColumnHeader>
          <Table.ColumnHeader>Amount (STX)</Table.ColumnHeader>
          <Table.ColumnHeader>Mining TX</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {entries.map((entry, idx) => (
          <Table.Row key={`${entry.txId}-${entry.block}-${idx}`}>
            <Table.Cell>
              <Link
                href={`https://explorer.hiro.so/block/${entry.block}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                color="blue.500"
              >
                {entry.block.toLocaleString()}
              </Link>
            </Table.Cell>
            <Table.Cell>
              <Badge size="sm" colorPalette="gray">
                {entry.version}
              </Badge>
            </Table.Cell>
            <Table.Cell>{formatStx(entry.amountUstx)}</Table.Cell>
            <Table.Cell>
              <Link
                href={`https://explorer.hiro.so/txid/${entry.txId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                color="blue.500"
              >
                {shortenTxId(entry.txId)}
              </Link>
            </Table.Cell>
            <Table.Cell>
              <Button size="xs" colorPalette="green" disabled>
                Claim
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

interface StackingClaimTableProps {
  entries: StackingEntry[];
  city: "mia" | "nyc";
}

function StackingClaimTable({ entries, city }: StackingClaimTableProps) {
  if (entries.length === 0) {
    return (
      <Text color="fg.muted" py={4}>
        No unclaimed stacking rewards found.
      </Text>
    );
  }

  const cityInfo = CITY_INFO[city];

  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Cycle</Table.ColumnHeader>
          <Table.ColumnHeader>Version</Table.ColumnHeader>
          <Table.ColumnHeader>Amount ({cityInfo.symbol})</Table.ColumnHeader>
          <Table.ColumnHeader>Stacking TX</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {entries.map((entry, idx) => (
          <Table.Row key={`${entry.txId}-${entry.cycle}-${idx}`}>
            <Table.Cell>{entry.cycle}</Table.Cell>
            <Table.Cell>
              <Badge size="sm" colorPalette="gray">
                {entry.version}
              </Badge>
            </Table.Cell>
            <Table.Cell>{entry.amountTokens.toLocaleString()}</Table.Cell>
            <Table.Cell>
              <Link
                href={`https://explorer.hiro.so/txid/${entry.txId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                color="blue.500"
              >
                {shortenTxId(entry.txId)}
              </Link>
            </Table.Cell>
            <Table.Cell>
              <Button size="xs" colorPalette="green" disabled>
                Claim
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

interface CitySummaryCardProps {
  city: "mia" | "nyc";
  summary: {
    miningTotal: number;
    miningClaimed: number;
    miningClaimable: number;
    miningPending: number;
    stackingTotal: number;
    stackingClaimed: number;
    stackingClaimable: number;
    stackingLocked: number;
  };
  unclaimedMining: MiningEntry[];
  unclaimedStacking: StackingEntry[];
}

function CitySummaryCard({
  city,
  summary,
  unclaimedMining,
  unclaimedStacking,
}: CitySummaryCardProps) {
  const cityInfo = CITY_INFO[city];
  const hasClaimable = summary.miningClaimable > 0 || summary.stackingClaimable > 0;

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">{cityInfo.displayName}</Heading>
        {hasClaimable && (
          <Badge colorPalette="green" size="lg">
            {summary.miningClaimable + summary.stackingClaimable} Claimable
          </Badge>
        )}
      </HStack>

      <Stack gap={4}>
        {/* Mining Summary */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="semibold">Mining</Text>
            <HStack gap={2}>
              <Badge colorPalette="green">{summary.miningClaimable} claimable</Badge>
              <Badge colorPalette="blue">{summary.miningPending} pending</Badge>
              <Badge colorPalette="gray">{summary.miningClaimed} claimed</Badge>
            </HStack>
          </HStack>

          {unclaimedMining.length > 0 && (
            <Accordion.Root collapsible>
              <Accordion.Item value="mining">
                <Accordion.ItemTrigger>
                  <Text>View {unclaimedMining.length} claimable mining rewards</Text>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <MiningClaimTable entries={unclaimedMining} city={city} />
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </Box>

        {/* Stacking Summary */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="semibold">Stacking</Text>
            <HStack gap={2}>
              <Badge colorPalette="green">{summary.stackingClaimable} claimable</Badge>
              <Badge colorPalette="purple">{summary.stackingLocked} locked</Badge>
              <Badge colorPalette="gray">{summary.stackingClaimed} claimed</Badge>
            </HStack>
          </HStack>

          {unclaimedStacking.length > 0 && (
            <Accordion.Root collapsible>
              <Accordion.Item value="stacking">
                <Accordion.ItemTrigger>
                  <Text>View {unclaimedStacking.length} claimable stacking rewards</Text>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <StackingClaimTable entries={unclaimedStacking} city={city} />
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

export default function ClaimsDashboard() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const summary = useAtomValue(claimsSummaryAtom);
  const miaUnclaimedMining = useAtomValue(miaUnclaimedMiningAtom);
  const miaUnclaimedStacking = useAtomValue(miaUnclaimedStackingAtom);
  const nycUnclaimedMining = useAtomValue(nycUnclaimedMiningAtom);
  const nycUnclaimedStacking = useAtomValue(nycUnclaimedStackingAtom);

  if (!stxAddress) {
    return (
      <Stack align="center" gap={4} py={8}>
        <Text>Connect your wallet to view pending claims.</Text>
        <SignIn />
      </Stack>
    );
  }

  const totalClaimable =
    summary.mia.miningClaimable +
    summary.mia.stackingClaimable +
    summary.nyc.miningClaimable +
    summary.nyc.stackingClaimable;

  return (
    <Stack gap={6}>
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Claims Dashboard
        </Heading>
        <Text color="fg.muted">
          View and manage your pending CityCoins mining and stacking claims.
        </Text>
      </Box>

      {/* Total Summary */}
      {totalClaimable > 0 ? (
        <Box
          bg="green.subtle"
          borderWidth="1px"
          borderColor="green.emphasized"
          borderRadius="lg"
          p={4}
        >
          <HStack justify="space-between">
            <Text fontWeight="semibold" color="green.fg">
              You have {totalClaimable} claimable rewards!
            </Text>
            <Button colorPalette="green" disabled>
              Claim All (Coming Soon)
            </Button>
          </HStack>
        </Box>
      ) : (
        <Box
          bg="gray.subtle"
          borderWidth="1px"
          borderColor="gray.emphasized"
          borderRadius="lg"
          p={4}
        >
          <Text color="fg.muted">No pending claims found. All rewards have been claimed!</Text>
        </Box>
      )}

      {/* City Cards */}
      <Stack gap={4}>
        <CitySummaryCard
          city="mia"
          summary={summary.mia}
          unclaimedMining={miaUnclaimedMining}
          unclaimedStacking={miaUnclaimedStacking}
        />
        <CitySummaryCard
          city="nyc"
          summary={summary.nyc}
          unclaimedMining={nycUnclaimedMining}
          unclaimedStacking={nycUnclaimedStacking}
        />
      </Stack>

      {/* Help Text */}
      <Box borderTopWidth="1px" pt={4}>
        <Text fontSize="sm" color="fg.muted">
          <strong>Note:</strong> Mining rewards become claimable 100 blocks after mining. Stacking
          rewards become claimable after the cycle ends. Claim buttons will be enabled in a future
          update.
        </Text>
      </Box>
    </Stack>
  );
}
