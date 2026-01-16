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
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  stxAddressAtom,
  blockHeightsAtom,
  blockHeightsQueryAtom,
  transactionFetchStatusAtom,
  fetchUserIdsAtom,
  userIdsAtom,
  userIdFetchStatusAtom,
} from "../../store/stacks";
import { loadable } from "jotai/utils";
import SignIn from "../auth/sign-in";
import { useState, useEffect } from "react";
import { fancyFetch, HIRO_API } from "../../store/common";
import { request } from "@stacks/connect";
import { AddressBalanceResponse, Transaction } from "@stacks/stacks-blockchain-api-types";
import {
  miaMiningEntriesAtom,
  miaStackingEntriesAtom,
  miaUnclaimedMiningAtom,
  miaUnclaimedStackingAtom,
  miningEntriesNeedingVerificationAtom,
  stackingEntriesNeedingVerificationAtom,
  MiningEntry,
  StackingEntry,
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
import { Version } from "../../config/city-config";
import ClaimsDebug from "../debug/claims-debug";

const loadableBlockHeights = loadable(blockHeightsQueryAtom);

/**
 * Format stacked token amount based on version.
 * legacyV1 tokens have 0 decimals, legacyV2+ have 6 decimals.
 */
function formatStackedAmount(amount: bigint, version: Version): string {
  if (version === "legacyV1") {
    // legacyV1 has 0 decimals - amount is the actual number
    return Number(amount).toLocaleString();
  }
  // legacyV2+ have 6 decimals
  return (Number(amount) / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface MiaProps {
  onOpenDetails: (tx: Transaction) => void;
}

function StatusBadge({ status }: { status: string }) {
  const colorScheme = {
    pending: "yellow",
    unverified: "orange",
    claimable: "green",
    claimed: "gray",
    locked: "blue",
    "not-won": "red",
    "no-reward": "orange",
    unavailable: "red",
    error: "red",
  }[status] || "gray";

  const displayText = {
    pending: "pending",
    unverified: "unverified",
    claimable: "claimable",
    claimed: "claimed",
    locked: "locked",
    "not-won": "not won",
    "no-reward": "no reward",
    unavailable: "unavailable",
    error: "error",
  }[status] || status;

  return <Badge colorPalette={colorScheme}>{displayText}</Badge>;
}

function Mia({ onOpenDetails }: MiaProps) {
  const stxAddress = useAtomValue(stxAddressAtom);
  const [blockHeights, setBlockHeights] = useAtom(blockHeightsAtom);
  const blockHeightsLoadable = useAtomValue(loadableBlockHeights);
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

  // Compute summaries
  const miningSummary = getMiningVerificationSummary(miningEntries);
  const stackingSummary = getStackingVerificationSummary(stackingEntries);

  // Redemption state
  const [hasChecked, setHasChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [balanceV1, setBalanceV1] = useState(0);
  const [balanceV2, setBalanceV2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Update blockHeights when async query completes
  useEffect(() => {
    if (blockHeightsLoadable.state === "hasData" && blockHeightsLoadable.data) {
      setBlockHeights(blockHeightsLoadable.data);
    }
  }, [blockHeightsLoadable, setBlockHeights]);

  // Fetch user IDs when address is available
  useEffect(() => {
    if (stxAddress && !userIds) {
      fetchUserIds();
    }
  }, [stxAddress, userIds, fetchUserIds]);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading size="4xl">MIA</Heading>
        <Text>
          Connect your wallet to access tools and utilities for MiamiCoin (MIA).
        </Text>
        <SignIn />
      </Stack>
    );
  }

  const MIA_ASSET_ID = "miamicoin";
  const MIA_V1_CONTRACT = "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token";
  const MIA_V2_CONTRACT = "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2";
  const MIA_REDEMPTION_CONTRACT = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd013-redemption-mia";

  const checkEligibility = async () => {
    if (!stxAddress) return;

    setIsLoading(true);
    try {
      const url = `${HIRO_API}/extended/v1/address/${stxAddress}/balances`;
      const data = await fancyFetch<AddressBalanceResponse>(url);
      const v1Balance = parseInt(
        data.fungible_tokens?.[`${MIA_V1_CONTRACT}::${MIA_ASSET_ID}`]?.balance || "0",
        10
      );
      const v2Balance = parseInt(
        data.fungible_tokens?.[`${MIA_V2_CONTRACT}::${MIA_ASSET_ID}`]?.balance || "0",
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
    const [address, name] = MIA_REDEMPTION_CONTRACT.split(".");
    try {
      await request("stx_callContract", {
        contract: `${address}.${name}`,
        functionName: "redeem-mia",
        functionArgs: [],
        postConditionMode: "allow",
      });
    } catch (error) {
      console.error("Error executing redemption:", error);
    }
  };

  const handleMiningClaim = async (entry: MiningEntry) => {
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
  };

  const handleStackingClaim = async (entry: StackingEntry) => {
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
  };

  const handleVerifyAllMining = () => {
    const miaEntries = miningNeedingVerification.filter((e) => e.city === "mia");
    if (miaEntries.length > 0) {
      verifyAllMining({ city: "mia", entries: miaEntries });
    }
  };

  const handleVerifyAllStacking = () => {
    const miaEntries = stackingNeedingVerification.filter((e) => e.city === "mia");
    if (miaEntries.length > 0) {
      verifyAllStacking({ city: "mia", entries: miaEntries });
    }
  };

  const handleRetryFailedMining = () => {
    retryFailedMining({ city: "mia", entries: miningEntries });
  };

  const handleRetryFailedStacking = () => {
    retryFailedStacking({ city: "mia", entries: stackingEntries });
  };

  const currentBlock = blockHeights?.stx ?? 0;
  const isVerifying = verificationProgress.isRunning && verificationProgress.city === "mia";

  // Count MIA-specific entries needing verification
  const miaUnverifiedMining = miningNeedingVerification.filter((e) => e.city === "mia").length;
  const miaUnverifiedStacking = stackingNeedingVerification.filter((e) => e.city === "mia").length;

  return (
    <Stack gap={4}>
      <Heading size="4xl">MIA</Heading>
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
                {(miaUnverifiedMining > 0 || miaUnverifiedStacking > 0) && (
                  <Text fontSize="sm">
                    You have {miaUnverifiedMining} mining blocks and {miaUnverifiedStacking} stacking cycles
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
                      Claim MIA tokens for blocks you mined. Each block must be claimed separately.
                    </Text>
                    <Table.Root size="sm">
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
                      Claim STX rewards for cycles you stacked. Final cycle also returns your MIA.
                    </Text>
                    <Table.Root size="sm">
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
        <Accordion.Item value="redeem-mia">
          <Accordion.ItemTrigger>
            <Heading size="xl">Redeem MIA</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            <Text mb={4}>
              Burn MIA to receive STX per{" "}
              <Link href="https://github.com/citycoins/governance/pull/50" target="_blank">
                CCIP-026
              </Link>
              .{" "}
              <Text as="span" color="fg.muted">
                Pending approval.
              </Text>
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
                <Text>MIA v1 Balance: {balanceV1}</Text>
                <Text>MIA v2 Balance: {(balanceV2 / 1_000_000).toFixed(2)}</Text>
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
            {miningEntries.length === 0 ? (
              <Text color="fg.muted">No mining history found.</Text>
            ) : (
              <Stack gap={4}>
                {/* Verification Controls */}
                <HStack gap={4}>
                  <Text fontSize="sm">
                    {miningSummary.claimable} claimable, {miningSummary.unverified} unverified,
                    {miningSummary.error > 0 && ` ${miningSummary.error} failed,`}
                    {" "}{miningSummary.notWon} not won, {miningSummary.claimed} claimed
                  </Text>
                  {miaUnverifiedMining > 0 && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleVerifyAllMining}
                      disabled={isVerifying}
                    >
                      Verify All ({miaUnverifiedMining})
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

                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Block</Table.ColumnHeader>
                      <Table.ColumnHeader>Version</Table.ColumnHeader>
                      <Table.ColumnHeader>Commit (STX)</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {miningEntries.map((entry) => (
                      <Table.Row key={`${entry.txId}-${entry.block}`}>
                        <Table.Cell>{entry.block}</Table.Cell>
                        <Table.Cell>{entry.version}</Table.Cell>
                        <Table.Cell>{(Number(entry.amountUstx) / 1_000_000).toFixed(6)}</Table.Cell>
                        <Table.Cell><StatusBadge status={entry.status} /></Table.Cell>
                        <Table.Cell minH="32px">
                          {entry.status === "claimable" ? (
                            <Button
                              size="xs"
                              onClick={() => handleMiningClaim(entry)}
                              disabled={claimingId === `mining-${entry.block}`}
                            >
                              {claimingId === `mining-${entry.block}` ? "..." : "Claim"}
                            </Button>
                          ) : entry.status === "unverified" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => verifySingleMining(entry)}
                              disabled={isVerifying}
                            >
                              Verify
                            </Button>
                          ) : entry.status === "error" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => verifySingleMining(entry)}
                              disabled={isVerifying}
                            >
                              Retry
                            </Button>
                          ) : (
                            <Box minH="24px" />
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>

        {/* Stacking History */}
        <Accordion.Item value="stacking-history">
          <Accordion.ItemTrigger>
            <Heading size="xl">Stacking History ({stackingEntries.length})</Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent p={4}>
            {stackingEntries.length === 0 ? (
              <Text color="fg.muted">No stacking history found.</Text>
            ) : (
              <Stack gap={4}>
                {/* Verification Controls */}
                <HStack gap={4}>
                  <Text fontSize="sm">
                    {stackingSummary.claimable} claimable, {stackingSummary.unverified} unverified,
                    {stackingSummary.error > 0 && ` ${stackingSummary.error} failed,`}
                    {" "}{stackingSummary.noReward} no reward, {stackingSummary.claimed} claimed
                  </Text>
                  {miaUnverifiedStacking > 0 && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleVerifyAllStacking}
                      disabled={isVerifying || !userIds}
                    >
                      Verify All ({miaUnverifiedStacking})
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

                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Cycle</Table.ColumnHeader>
                      <Table.ColumnHeader>Version</Table.ColumnHeader>
                      <Table.ColumnHeader>Stacked</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {stackingEntries.map((entry) => (
                      <Table.Row key={`${entry.txId}-${entry.cycle}`}>
                        <Table.Cell>{entry.cycle}</Table.Cell>
                        <Table.Cell>{entry.version}</Table.Cell>
                        <Table.Cell>{formatStackedAmount(entry.amountTokens, entry.version)}</Table.Cell>
                        <Table.Cell><StatusBadge status={entry.status} /></Table.Cell>
                        <Table.Cell minH="32px">
                          {entry.status === "claimable" ? (
                            <Button
                              size="xs"
                              onClick={() => handleStackingClaim(entry)}
                              disabled={claimingId === `stacking-${entry.cycle}`}
                            >
                              {claimingId === `stacking-${entry.cycle}` ? "..." : "Claim"}
                            </Button>
                          ) : entry.status === "unverified" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => verifySingleStacking(entry)}
                              disabled={isVerifying || !userIds}
                            >
                              Verify
                            </Button>
                          ) : entry.status === "unavailable" && entry.claimTxId ? (
                            <Text fontSize="xs" color="fg.muted">Failed</Text>
                          ) : (
                            <Box minH="24px" />
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Stack>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>

        {/* Debug Info - Remove after debugging */}
        <ClaimsDebug city="mia" />
      </Accordion.Root>
    </Stack>
  );
}

export default Mia;
