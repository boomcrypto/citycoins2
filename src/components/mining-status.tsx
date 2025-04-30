import { useAtomValue } from "jotai";
import {
  enhancedMiningTransactionsAtom,
  unclaimedMiningRewardsAtom,
  UnclaimedReward,
} from "../store/mining-analysis";
import { blockHeightsAtom } from "../store/stacks";
import { useMiningClaims } from "../hooks/use-mining-claims";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Heading,
  Badge,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Tooltip,
  Link,
  Spinner,
} from "@chakra-ui/react";
import { formatAmount } from "../store/common";

export function MiningStatus() {
  const enhancedMiningTxs = useAtomValue(enhancedMiningTransactionsAtom);
  const unclaimedRewards = useAtomValue(unclaimedMiningRewardsAtom);
  const blockHeights = useAtomValue(blockHeightsAtom);
  const currentBlockHeight = blockHeights?.stx || 0;
  const { claimMiningReward, isRequestPending } = useMiningClaims();

  // Calculate summary statistics
  const totalBlocksMined = enhancedMiningTxs.reduce(
    (sum, tx) => sum + tx.blocks_mined,
    0
  );
  const totalBlocksClaimed = enhancedMiningTxs.reduce(
    (sum, tx) =>
      sum + tx.claimed_status.filter((status) => status.claimed).length,
    0
  );
  const totalBlocksUnclaimed = totalBlocksMined - totalBlocksClaimed;
  const matureUnclaimedBlocks = unclaimedRewards.filter(
    (reward) => reward.is_mature
  ).length;

  if (!blockHeights) {
    return (
      <Stack spacing={4} align="center" justify="center" h="200px">
        <Spinner size="xl" />
        <Text>Loading blockchain data...</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={4}>
          Mining Status Summary
        </Heading>
        <Text>Current Block Height: {formatAmount(currentBlockHeight)}</Text>
        <Text>Total Mining Transactions: {enhancedMiningTxs.length}</Text>
        <Text>Total Blocks Mined: {formatAmount(totalBlocksMined)}</Text>
        <Text>
          Claimed: {formatAmount(totalBlocksClaimed)} | Unclaimed:{" "}
          {formatAmount(totalBlocksUnclaimed)} (
          <Badge colorScheme="green">
            {formatAmount(matureUnclaimedBlocks)} mature
          </Badge>{" "}
          |
          <Badge colorScheme="yellow">
            {formatAmount(totalBlocksUnclaimed - matureUnclaimedBlocks)}{" "}
            immature
          </Badge>
          )
        </Text>
      </Box>

      <Accordion allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Mining Transactions ({enhancedMiningTxs.length})
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {enhancedMiningTxs.length === 0 ? (
              <Text>No mining transactions found.</Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>TX ID</Th>
                    <Th>Block Height</Th>
                    <Th>City</Th>
                    <Th>Blocks Mined</Th>
                    <Th>Claim Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {enhancedMiningTxs.map((tx) => {
                    const claimedCount = tx.claimed_status.filter(
                      (status) => status.claimed
                    ).length;
                    const claimPercentage =
                      (claimedCount / tx.blocks_mined) * 100;

                    return (
                      <Tr key={tx.tx_id}>
                        <Td>
                          <Tooltip label={tx.tx_id}>
                            <Link
                              href={`https://explorer.hiro.so/txid/${tx.tx_id}?chain=mainnet`}
                              isExternal
                            >
                              {tx.tx_id.substring(0, 8)}...
                              {tx.tx_id.substring(tx.tx_id.length - 8)}
                            </Link>
                          </Tooltip>
                        </Td>
                        <Td>{tx.block_height}</Td>
                        <Td>{tx.city_name.toUpperCase()}</Td>
                        <Td>{tx.blocks_mined}</Td>
                        <Td>
                          {claimedCount === tx.blocks_mined ? (
                            <Badge colorScheme="green">All Claimed</Badge>
                          ) : claimedCount > 0 ? (
                            <Badge colorScheme="yellow">
                              {claimedCount}/{tx.blocks_mined} (
                              {claimPercentage.toFixed(0)}%)
                            </Badge>
                          ) : (
                            <Badge colorScheme="red">Unclaimed</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Unclaimed Mining Rewards ({unclaimedRewards.length})
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {unclaimedRewards.length === 0 ? (
              <Text>All mining rewards have been claimed!</Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Block to Claim</Th>
                    <Th>City</Th>
                    <Th>Amount</Th>
                    <Th>Maturity</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unclaimedRewards.map((reward) => {
                    const blocksUntilMaturity =
                      reward.maturity_height - currentBlockHeight;

                    return (
                      <Tr key={`${reward.tx_id}-${reward.block_height}`}>
                        <Td>{reward.block_height}</Td>
                        <Td>{reward.city_name.toUpperCase()}</Td>
                        <Td>{formatAmount(reward.amount)} μSTX</Td>
                        <Td>
                          {reward.is_mature ? (
                            <Badge colorScheme="green">Mature</Badge>
                          ) : (
                            <Badge colorScheme="yellow">
                              {blocksUntilMaturity} blocks remaining
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={reward.is_mature ? "green" : "yellow"}
                          >
                            {reward.is_mature
                              ? "Ready to claim"
                              : "Not yet claimable"}
                          </Badge>
                        </Td>
                        <Td>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            isDisabled={!reward.is_mature || isRequestPending}
                            isLoading={isRequestPending}
                            onClick={() => claimMiningReward(reward)}
                          >
                            Claim
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
