import {
  Accordion,
  Button,
  Heading,
  Link,
  Stack,
  Text,
  Badge,
  Table,
  Box,
  Progress,
  HStack,
} from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  stxAddressAtom,
  blockHeightsAtom,
  fetchBlockHeightsAtom,
  transactionFetchStatusAtom,
  fetchUserIdsAtom,
  userIdsAtom,
  userIdFetchStatusAtom,
} from "../../store/stacks";
import SignIn from "../auth/sign-in";
import { useState, useEffect, useMemo, useCallback } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { request } from "@stacks/connect";
import { AddressBalanceResponse } from "@stacks/stacks-blockchain-api-types";
import {
  miaMiningEntriesAtom,
  miaStackingEntriesAtom,
  miaUnclaimedMiningAtom,
  miaUnclaimedStackingAtom,
  miningEntriesNeedingVerificationAtom,
  stackingEntriesNeedingVerificationAtom,
} from "../../store/claims";
import {
  verificationProgressAtom,
  verifyAllMiningAtom,
  verifyAllStackingAtom,
  verifySingleMiningAtom,
  verifySingleStackingAtom,
  retryFailedMiningAtom,
  retryFailedStackingAtom,
  miningVerificationSummaryAtom,
  stackingVerificationSummaryAtom,
} from "../../store/verification";
import {
  buildMiningClaimTx,
  buildStackingClaimTx,
  executeClaimTransaction,
} from "../../utilities/claim-transactions";
import {
  PaginatedMiningTable,
  PaginatedStackingTable,
  formatStackedAmount,
  type MiningEntry,
  type StackingEntry,
} from "../claims";
import { CITY_CLAIMS_CONFIG } from "../../config/city-claims-config";

const config = CITY_CLAIMS_CONFIG.mia;

function Mia() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const blockHeights = useAtomValue(blockHeightsAtom);
  const fetchBlockHeights = useSetAtom(fetchBlockHeightsAtom);
  const fetchStatus = useAtomValue(transactionFetchStatusAtom);

  // User IDs for stacking verification
  const userIds = useAtomValue(userIdsAtom);
  const userIdFetchStatus = useAtomValue(userIdFetchStatusAtom);
  const fetchUserIds = useSetAtom(fetchUserIdsAtom);

  // Claims atoms for MIA
  const miningEntries = useAtomValue(miaMiningEntriesAtom);
  const stackingEntries = useAtomValue(miaStackingEntriesAtom);
  const unclaimedMining = useAtomValue(miaUnclaimedMiningAtom);
  const unclaimedStacking = useAtomValue(miaUnclaimedStackingAtom);

  // Entries needing verification
  const miningNeedingVerification = useAtomValue(miningEntriesNeedingVerificationAtom);
  const stackingNeedingVerification = useAtomValue(stackingEntriesNeedingVerificationAtom);

  // Verification actions
  const verifyAllMining = useSetAtom(verifyAllMiningAtom);
  const verifyAllStacking = useSetAtom(verifyAllStackingAtom);
  const verifySingleMining = useSetAtom(verifySingleMiningAtom);
  const verifySingleStacking = useSetAtom(verifySingleStackingAtom);
  const retryFailedMining = useSetAtom(retryFailedMiningAtom);
  const retryFailedStacking = useSetAtom(retryFailedStackingAtom);

  // Verification progress and summaries
  const verificationProgress = useAtomValue(verificationProgressAtom);
  const getMiningVerificationSummary = useAtomValue(miningVerificationSummaryAtom);
  const getStackingVerificationSummary = useAtomValue(stackingVerificationSummaryAtom);

  // Compute summaries (memoized via useMemo)
  const miningSummary = useMemo(
    () => getMiningVerificationSummary(miningEntries),
    [getMiningVerificationSummary, miningEntries]
  );
  const stackingSummary = useMemo(
    () => getStackingVerificationSummary(stackingEntries),
    [getStackingVerificationSummary, stackingEntries]
  );

  // Redemption state
  const [hasChecked, setHasChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [balanceV1, setBalanceV1] = useState(0);
  const [balanceV2, setBalanceV2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Fetch block heights on mount and when address changes
  useEffect(() => {
    if (stxAddress) {
      fetchBlockHeights();
    }
  }, [stxAddress, fetchBlockHeights]);

  // Fetch user IDs when address is available
  useEffect(() => {
    if (stxAddress && !userIds) {
      fetchUserIds();
    }
  }, [stxAddress, userIds, fetchUserIds]);

  // Memoized handlers
  const handleMiningClaim = useCallback(async (entry: MiningEntry) => {
    const id = `mining-${entry.block}`;
    setClaimingId(id);
    try {
      const params = buildMiningClaimTx(entry.city, entry.version, entry.block);
      await executeClaimTransaction(params);
    } catch (error) {
      console.error("Mining claim failed:", error);
    } finally {
      setClaimingId(null);
    }
  }, []);

  const handleStackingClaim = useCallback(async (entry: StackingEntry) => {
    const id = `stacking-${entry.cycle}`;
    setClaimingId(id);
    try {
      const params = buildStackingClaimTx(entry.city, entry.version, entry.cycle);
      await executeClaimTransaction(params);
    } catch (error) {
      console.error("Stacking claim failed:", error);
    } finally {
      setClaimingId(null);
    }
  }, []);

  const handleVerifyMining = useCallback((entry: MiningEntry) => {
    verifySingleMining(entry);
  }, [verifySingleMining]);

  const handleVerifyStacking = useCallback((entry: StackingEntry) => {
    verifySingleStacking(entry);
  }, [verifySingleStacking]);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">{config.symbol}</Heading>
        <Text>
          Connect your wallet to access tools and utilities for MiamiCoin ({config.symbol}).
        </Text>
        <SignIn />
      </Stack>
    );
  }

  const checkEligibility = async () => {
    if (!stxAddress) return;

    setIsLoading(true);
    try {
      const url = `${HIRO_API}/extended/v1/address/${stxAddress}/balances`;
      const data = await fancyFetch<AddressBalanceResponse>(url);
      const v1Balance = parseInt(
        data.fungible_tokens?.[`${config.v1Contract}::${config.assetId}`]?.balance || "0",
        10
      );
      const v2Balance = parseInt(
        data.fungible_tokens?.[`${config.v2Contract}::${config.assetId}`]?.balance || "0",
        10
      );

      setBalanceV1(v1Balance);
      setBalanceV2(v2Balance);
      setIsEligible(v1Balance > 0 || v2Balance > 0);
      setHasChecked(true);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRedemption = async () => {
    const [address, name] = config.redemptionContract.split(".");
    try {
      await request("stx_callContract", {
        contract: `${address}.${name}`,
        functionName: config.redemptionFunction,
        functionArgs: [],
        postConditionMode: "allow",
      });
    } catch (error) {
      console.error("Error executing redemption:", error);
    }
  };

  const handleVerifyAllMining = () => {
    const cityEntries = miningNeedingVerification.filter((e) => e.city === config.cityName);
    if (cityEntries.length > 0) {
      verifyAllMining({ city: config.cityName, entries: cityEntries });
    }
  };

  const handleVerifyAllStacking = () => {
    const cityEntries = stackingNeedingVerification.filter((e) => e.city === config.cityName);
    if (cityEntries.length > 0) {
      verifyAllStacking({ city: config.cityName, entries: cityEntries });
    }
  };

  const handleRetryFailedMining = () => {
    retryFailedMining({ city: config.cityName, entries: miningEntries });
  };

  const handleRetryFailedStacking = () => {
    retryFailedStacking({ city: config.cityName, entries: stackingEntries });
  };

  const currentBlock = blockHeights?.stx ?? 0;
  const isVerifying = verificationProgress.isRunning && verificationProgress.city === config.cityName;

  // Count city-specific entries needing verification
  const cityUnverifiedMining = miningNeedingVerification.filter((e) => e.city === config.cityName).length;
  const cityUnverifiedStacking = stackingNeedingVerification.filter((e) => e.city === config.cityName).length;

  return (
    <Stack gap={4}>
      <Heading size="4xl">{config.symbol}</Heading>
      <Text>
        Current block: {currentBlock || "Loading..."} |
        Mining: {miningSummary.claimable} claimable
        {miningSummary.unverified > 0 && ` (${miningSummary.unverified} unverified)`} |
        Stacking: {stackingSummary.claimable} claimable
        {stackingSummary.unverified > 0 && ` (${stackingSummary.unverified} unverified)`}
      </Text>

      {/* Transaction loading progress */}
      {fetchStatus.isLoading && (
        <Box>
          <Text fontSize="sm" mb={1}>Loading transactions... {fetchStatus.progress}%</Text>
          <Progress.Root value={fetchStatus.progress} max={100} size="sm">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Box>
      )}

      {/* User ID loading status */}
      {userIdFetchStatus.isLoading && (
        <Text fontSize="sm" color="fg.muted">Loading user IDs...</Text>
      )}

      {/* Verification progress */}
      {isVerifying && verificationProgress.total > 0 && (
        <Box>
          <Text fontSize="sm" mb={1}>
            Verifying {verificationProgress.type} claims... {verificationProgress.current}/{verificationProgress.total}
            {verificationProgress.currentItem && ` - ${verificationProgress.currentItem}`}
          </Text>
          <Progress.Root value={verificationProgress.current} max={verificationProgress.total} size="sm">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Box>
      )}

      <Accordion.Root collapsible defaultValue={["unclaimed-funds"]}>
        {/* Unclaimed Funds - Most actionable, shown first */}
        <Accordion.Item value="unclaimed-funds">
          <Accordion.ItemTrigger>
            <Heading size="xl">
              Unclaimed Funds
              {(unclaimedMining.length > 0 || unclaimedStacking.length > 0) && (
                <Badge colorPalette="green" ml={2}>
                  {unclaimedMining.length + unclaimedStacking.length}
                </Badge>
              )}
            </Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            {unclaimedMining.length === 0 && unclaimedStacking.length === 0 ? (
              <Stack gap={4}>
                <Text color="fg.muted">No verified claimable funds yet.</Text>
                {(cityUnverifiedMining > 0 || cityUnverifiedStacking > 0) && (
                  <Text fontSize="sm">
                    You have {cityUnverifiedMining} mining blocks and {cityUnverifiedStacking} stacking cycles
                    that need verification. Check the history sections below to verify them.
                  </Text>
                )}
              </Stack>
            ) : (
              <Stack gap={6}>
                {/* Unclaimed Mining */}
                {unclaimedMining.length > 0 && (
                  <Box>
                    <Heading size="md" mb={2}>Mining Rewards ({unclaimedMining.length})</Heading>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Claim {config.symbol} tokens for blocks you mined. Each block must be claimed separately.
                    </Text>
                    <Table.Root size="sm" width="100%">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Block</Table.ColumnHeader>
                          <Table.ColumnHeader>Version</Table.ColumnHeader>
                          <Table.ColumnHeader>Commit (STX)</Table.ColumnHeader>
                          <Table.ColumnHeader>Action</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {unclaimedMining.map((entry) => (
                          <Table.Row key={`${entry.txId}-${entry.block}`}>
                            <Table.Cell>{entry.block}</Table.Cell>
                            <Table.Cell>{entry.version}</Table.Cell>
                            <Table.Cell>{(Number(entry.amountUstx) / 1_000_000).toFixed(6)}</Table.Cell>
                            <Table.Cell>
                              <Button
                                size="xs"
                                onClick={() => handleMiningClaim(entry)}
                                disabled={claimingId === `mining-${entry.block}`}
                              >
                                {claimingId === `mining-${entry.block}` ? "Claiming..." : "Claim"}
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}

                {/* Unclaimed Stacking */}
                {unclaimedStacking.length > 0 && (
                  <Box>
                    <Heading size="md" mb={2}>Stacking Rewards ({unclaimedStacking.length})</Heading>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Claim STX rewards for cycles you stacked. Final cycle also returns your {config.symbol}.
                    </Text>
                    <Table.Root size="sm" width="100%">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Cycle</Table.ColumnHeader>
                          <Table.ColumnHeader>Version</Table.ColumnHeader>
                          <Table.ColumnHeader>Stacked</Table.ColumnHeader>
                          <Table.ColumnHeader>Action</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {unclaimedStacking.map((entry) => (
                          <Table.Row key={`${entry.txId}-${entry.cycle}`}>
                            <Table.Cell>{entry.cycle}</Table.Cell>
                            <Table.Cell>{entry.version}</Table.Cell>
                            <Table.Cell>{formatStackedAmount(entry.amountTokens, entry.version)}</Table.Cell>
                            <Table.Cell>
                              <Button
                                size="xs"
                                onClick={() => handleStackingClaim(entry)}
                                disabled={claimingId === `stacking-${entry.cycle}`}
                              >
                                {claimingId === `stacking-${entry.cycle}` ? "Claiming..." : "Claim"}
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>

        {/* Redemption */}
        <Accordion.Item value={`redeem-${config.cityName}`}>
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem {config.symbol}</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Text mb={4}>
              Burn {config.symbol} to receive STX per{" "}
              <Link href={config.ccipLink.href} target="_blank">
                {config.ccipLink.text}
              </Link>
              .{config.pendingApproval && (
                <>
                  {" "}
                  <Text as="span" color="fg.muted">
                    Pending approval.
                  </Text>
                </>
              )}
            </Text>
            <Stack direction="row" gap={4}>
              <Button
                variant="outline"
                onClick={checkEligibility}
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Check Eligibility"}
              </Button>
              <Button
                variant="outline"
                onClick={executeRedemption}
                disabled={!hasChecked || !isEligible || isLoading}
              >
                Execute Redemption
              </Button>
            </Stack>
            {hasChecked && (
              <Stack mt={4}>
                <Text>{config.symbol} v1 Balance: {balanceV1}</Text>
                <Text>{config.symbol} v2 Balance: {(balanceV2 / 1_000_000).toFixed(2)}</Text>
                <Text>
                  {isEligible
                    ? "You are eligible for redemption."
                    : "You are not eligible for redemption."}
                </Text>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>

        {/* Mining History */}
        <Accordion.Item value="mining-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">Mining History ({miningEntries.length})</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Stack gap={4}>
              {/* Verification Controls */}
              <HStack gap={4} flexWrap="wrap">
                <Text fontSize="sm">
                  {miningSummary.claimable} claimable, {miningSummary.unverified} unverified,
                  {miningSummary.error > 0 && ` ${miningSummary.error} failed,`}
                  {" "}{miningSummary.notWon} not won, {miningSummary.claimed} claimed
                </Text>
                {cityUnverifiedMining > 0 && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleVerifyAllMining}
                    disabled={isVerifying}
                  >
                    Verify All ({cityUnverifiedMining})
                  </Button>
                )}
                {miningSummary.error > 0 && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleRetryFailedMining}
                    disabled={isVerifying}
                  >
                    Retry Failed ({miningSummary.error})
                  </Button>
                )}
              </HStack>

              <PaginatedMiningTable
                entries={miningEntries}
                onClaim={handleMiningClaim}
                onVerify={handleVerifyMining}
                claimingId={claimingId}
                isVerifying={isVerifying}
              />
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>

        {/* Stacking History */}
        <Accordion.Item value="stacking-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">Stacking History ({stackingEntries.length})</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Stack gap={4}>
              {/* Verification Controls */}
              <HStack gap={4} flexWrap="wrap">
                <Text fontSize="sm">
                  {stackingSummary.claimable} claimable, {stackingSummary.unverified} unverified,
                  {stackingSummary.error > 0 && ` ${stackingSummary.error} failed,`}
                  {" "}{stackingSummary.noReward} no reward, {stackingSummary.claimed} claimed
                </Text>
                {cityUnverifiedStacking > 0 && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleVerifyAllStacking}
                    disabled={isVerifying || !userIds}
                  >
                    Verify All ({cityUnverifiedStacking})
                  </Button>
                )}
                {stackingSummary.error > 0 && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleRetryFailedStacking}
                    disabled={isVerifying || !userIds}
                  >
                    Retry Failed ({stackingSummary.error})
                  </Button>
                )}
              </HStack>

              <PaginatedStackingTable
                entries={stackingEntries}
                onClaim={handleStackingClaim}
                onVerify={handleVerifyStacking}
                claimingId={claimingId}
                isVerifying={isVerifying}
                hasUserIds={!!userIds}
              />
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>

      </Accordion.Root>
    </Stack>
  );
}

export default Mia;
