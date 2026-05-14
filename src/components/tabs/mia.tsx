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
  Input,
  SimpleGrid,
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
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import {
  miaMiningEntriesAtom,
  miaStackingEntriesAtom,
  miaUnclaimedMiningAtom,
  miaUnclaimedStackingAtom,
  miningEntriesNeedingVerificationAtom,
  stackingEntriesNeedingVerificationAtom,
  addPendingClaimTransactionAtom,
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
  buildMiaRedeemPostConditions,
  getCcd013RedemptionInfo,
  getCcd013UserRedemptionInfo,
  MAX_MIA_REDEMPTION_PER_TX_UMIA,
  type Ccd013RedemptionInfo,
  type Ccd013UserRedemptionInfo,
} from "../../utilities/contract-reads";
import {
  PaginatedMiningTable,
  PaginatedStackingTable,
  formatStackedAmount,
  type MiningEntry,
  type StackingEntry,
} from "../claims";
import { CITY_CLAIMS_CONFIG } from "../../config/city-claims-config";

const config = CITY_CLAIMS_CONFIG.mia;

function formatWholeAmount(value: bigint): string {
  return value.toLocaleString();
}

function formatMicroAmount(value: bigint, maximumFractionDigits = 6): string {
  const whole = value / 1_000_000n;
  const fraction = value % 1_000_000n;
  const trimmedFraction = fraction
    .toString()
    .padStart(6, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");

  return `${whole.toLocaleString()}${trimmedFraction ? `.${trimmedFraction}` : ""}`;
}

function parseOptionalUmiaInput(value: string): bigint | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Enter a whole uMIA amount.");
  }
  const parsed = BigInt(trimmed);
  if (parsed === 0n) {
    throw new Error("Enter an amount greater than zero.");
  }
  return parsed;
}

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
  const [redemptionInfo, setRedemptionInfo] = useState<Ccd013RedemptionInfo | null>(null);
  const [userRedemptionInfo, setUserRedemptionInfo] = useState<Ccd013UserRedemptionInfo | null>(null);
  const [manualAmountUmia, setManualAmountUmia] = useState("");
  const [redemptionStatus, setRedemptionStatus] = useState<"idle" | "loading" | "submitting">("idle");
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [redemptionTxid, setRedemptionTxid] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const addPendingClaimTransaction = useSetAtom(addPendingClaimTransactionAtom);

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
      const txId = await executeClaimTransaction(params);
      if (txId) {
        addPendingClaimTransaction({
          city: entry.city,
          version: entry.version,
          type: "mining",
          id: entry.block,
          txId,
        });
      }
    } catch (error) {
      console.error("Mining claim failed:", error);
    } finally {
      setClaimingId(null);
    }
  }, [addPendingClaimTransaction]);

  const handleStackingClaim = useCallback(async (entry: StackingEntry) => {
    const id = `stacking-${entry.cycle}`;
    setClaimingId(id);
    try {
      const params = buildStackingClaimTx(entry.city, entry.version, entry.cycle);
      const txId = await executeClaimTransaction(params);
      if (txId) {
        addPendingClaimTransaction({
          city: entry.city,
          version: entry.version,
          type: "stacking",
          id: entry.cycle,
          txId,
        });
      }
    } catch (error) {
      console.error("Stacking claim failed:", error);
    } finally {
      setClaimingId(null);
    }
  }, [addPendingClaimTransaction]);

  const handleVerifyMining = useCallback((entry: MiningEntry) => {
    verifySingleMining(entry);
  }, [verifySingleMining]);

  const handleVerifyStacking = useCallback((entry: StackingEntry) => {
    verifySingleStacking(entry);
  }, [verifySingleStacking]);

  const loadRedemptionPreview = useCallback(async () => {
    if (!stxAddress) return;

    setRedemptionStatus("loading");
    setRedemptionError(null);
    try {
      const amountUmia = parseOptionalUmiaInput(manualAmountUmia);
      const [globalResult, userResult] = await Promise.all([
        getCcd013RedemptionInfo(stxAddress),
        getCcd013UserRedemptionInfo(stxAddress, amountUmia),
      ]);

      if (!globalResult.ok || !globalResult.data) {
        throw new Error(globalResult.error || "Unable to load redemption status.");
      }
      if (!userResult.ok || !userResult.data) {
        throw new Error(userResult.error || "Unable to load redemption preview.");
      }

      setRedemptionInfo(globalResult.data);
      setUserRedemptionInfo(userResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRedemptionError(message);
      console.error("Error loading redemption preview:", error);
    } finally {
      setRedemptionStatus("idle");
    }
  }, [manualAmountUmia, stxAddress]);

  useEffect(() => {
    loadRedemptionPreview();
  }, [loadRedemptionPreview]);

  const executeRedemption = async () => {
    if (!stxAddress || !userRedemptionInfo) return;
    const [address, name] = config.redemptionContract.split(".");
    setRedemptionStatus("submitting");
    setRedemptionError(null);
    setRedemptionTxid(null);
    try {
      const result = await request("stx_callContract", {
        contract: `${address}.${name}`,
        functionName: config.redemptionFunction,
        functionArgs: [Cl.serialize(Cl.uint(userRedemptionInfo.burnAmountUmia))],
        postConditions: buildMiaRedeemPostConditions({
          userAddress: stxAddress,
          burnAmountV1Mia: userRedemptionInfo.burnAmountV1Mia,
          burnAmountV2Umia: userRedemptionInfo.burnAmountV2Umia,
          redemptionAmountUstx: userRedemptionInfo.redemptionAmountUstx,
        }),
        postConditionMode: "deny",
      });
      if (result.txid) {
        setRedemptionTxid(result.txid);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRedemptionError(message);
      console.error("Error executing redemption:", error);
    } finally {
      setRedemptionStatus("idle");
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
  const redemptionLoading = redemptionStatus === "loading";
  const redemptionSubmitting = redemptionStatus === "submitting";
  const redemptionEnabled = redemptionInfo?.redemptionEnabled ?? false;
  const canRedeem =
    redemptionEnabled &&
    !!userRedemptionInfo &&
    userRedemptionInfo.burnAmountUmia > 0n &&
    userRedemptionInfo.redemptionAmountUstx > 0n &&
    !redemptionLoading &&
    !redemptionSubmitting;

  // Count city-specific entries needing verification
  const cityUnverifiedMining = miningNeedingVerification.filter((e) => e.city === config.cityName).length;
  const cityUnverifiedStacking = stackingNeedingVerification.filter((e) => e.city === config.cityName).length;

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
            <Stack gap={4}>
              <Text>
                Burn {config.symbol} to receive STX per{" "}
                <Link href={config.ccipLink.href} target="_blank">
                  {config.ccipLink.text}
                </Link>
                .{" "}
                <Text as="span" color={redemptionEnabled ? "green.500" : "fg.muted"}>
                  {redemptionEnabled
                    ? "Redemption is enabled."
                    : "Redemption is waiting for direct execution and initialization."}
                </Text>
              </Text>

              {config.pendingApproval && (
                <Badge alignSelf="flex-start" colorPalette="yellow">
                  Pending approval
                </Badge>
              )}

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="fg.muted">Ratio</Text>
                  <Text fontWeight="semibold">
                    {redemptionInfo
                      ? `${formatMicroAmount(redemptionInfo.redemptionRatio)} STX / MIA`
                      : "Loading..."}
                  </Text>
                </Box>
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="fg.muted">Treasury Snapshot</Text>
                  <Text fontWeight="semibold">
                    {redemptionInfo
                      ? `${formatMicroAmount(redemptionInfo.miningTreasuryUstx)} STX`
                      : "Loading..."}
                  </Text>
                </Box>
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="fg.muted">Remaining STX</Text>
                  <Text fontWeight="semibold">
                    {redemptionInfo
                      ? `${formatMicroAmount(redemptionInfo.currentContractBalance)} STX`
                      : "Loading..."}
                  </Text>
                </Box>
              </SimpleGrid>

              {redemptionInfo && (
                <Text fontSize="sm" color="fg.muted">
                  Initialized at block {formatWholeAmount(redemptionInfo.blockHeight)}.
                  Total supply snapshot: {formatMicroAmount(redemptionInfo.totalSupply)} MIA.
                  Redeemed so far: {formatMicroAmount(redemptionInfo.totalRedeemed)} MIA for{" "}
                  {formatMicroAmount(redemptionInfo.totalTransferred)} STX.
                </Text>
              )}

              <Box>
                <Text fontSize="sm" mb={1}>
                  Manual amount override (uMIA)
                </Text>
                <Input
                  value={manualAmountUmia}
                  onChange={(event) => setManualAmountUmia(event.target.value)}
                  placeholder="Leave blank to redeem all eligible MIA"
                  inputMode="numeric"
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  Blank previews your full eligible balance, capped at 10,000,000 MIA per transaction.
                </Text>
              </Box>

              {userRedemptionInfo && (
                <Table.Root size="sm" width="100%">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>MIA v1 balance</Table.Cell>
                      <Table.Cell textAlign="right">{formatWholeAmount(userRedemptionInfo.balanceV1Mia)} MIA</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>MIA v2 balance</Table.Cell>
                      <Table.Cell textAlign="right">{formatMicroAmount(userRedemptionInfo.balanceV2Umia)} MIA</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Combined balance</Table.Cell>
                      <Table.Cell textAlign="right">{formatMicroAmount(userRedemptionInfo.totalBalanceUmia)} MIA</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Already redeemed</Table.Cell>
                      <Table.Cell textAlign="right">
                        {formatMicroAmount(userRedemptionInfo.claimedUmia)} MIA for{" "}
                        {formatMicroAmount(userRedemptionInfo.claimedUstx)} STX
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Burn split</Table.Cell>
                      <Table.Cell textAlign="right">
                        {formatWholeAmount(userRedemptionInfo.burnAmountV1Mia)} v1 MIA +{" "}
                        {formatMicroAmount(userRedemptionInfo.burnAmountV2Umia)} v2 MIA
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Expected STX</Table.Cell>
                      <Table.Cell textAlign="right">{formatMicroAmount(userRedemptionInfo.redemptionAmountUstx)} STX</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              )}

              {userRedemptionInfo && userRedemptionInfo.burnAmountUmia === MAX_MIA_REDEMPTION_PER_TX_UMIA && (
                <Text fontSize="sm" color="fg.muted">
                  Preview is capped at 10,000,000 MIA. Repeat the flow to redeem more.
                </Text>
              )}

              {redemptionError && <Text color="red.500">{redemptionError}</Text>}
              {redemptionTxid && (
                <Text fontSize="sm" color="fg.muted">
                  Submitted transaction: {redemptionTxid}
                </Text>
              )}

              <HStack gap={4} flexWrap="wrap">
                <Button
                  variant="outline"
                  onClick={loadRedemptionPreview}
                  disabled={redemptionLoading || redemptionSubmitting}
                >
                  {redemptionLoading ? "Refreshing..." : "Refresh Preview"}
                </Button>
                <Button
                  variant="outline"
                  onClick={executeRedemption}
                  disabled={!canRedeem}
                >
                  {redemptionSubmitting ? "Submitting..." : "Redeem MIA"}
                </Button>
              </HStack>
            </Stack>
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
                  {" "}{stackingSummary.noReward} no reward,
                  {stackingSummary.unpaid > 0 && ` ${stackingSummary.unpaid} unpaid,`}
                  {" "}{stackingSummary.claimed} claimed
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
