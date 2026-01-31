/**
 * Verification State Management
 *
 * Handles mining and stacking claim verification with:
 * - Persistent cache in localStorage (cleared via clear data button)
 * - Manual trigger controls (verify single, verify all, retry failed)
 * - Progress tracking with clear state indication
 * - Error handling with inline retry
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CityName, Version } from "../config/city-config";
import {
  verifyMiningClaim,
  verifyStackingClaim,
  getUserIdForVersion,
} from "../utilities/claim-verification";
import { stxAddressAtom, userIdsAtom } from "./stacks";
import { MiningEntry, StackingEntry } from "./claims";
import {
  broadcastVerificationUpdate,
  subscribeToBroadcasts,
  mergeVerificationEntries,
  isVerificationUpdateMessage,
  VerificationUpdatePayload,
  BroadcastMessage,
  Unsubscribe,
} from "../utilities/broadcast-sync";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Verification status for a claim entry
 */
export type VerificationStatus =
  | "unverified" // Not yet checked
  | "verifying" // Currently checking
  | "claimable" // Verified: can claim reward
  | "not-won" // Verified: didn't win mining lottery
  | "no-reward" // Verified: no stacking reward available
  | "claimed" // Already claimed
  | "error"; // Verification failed

/**
 * Stored verification result
 */
export interface VerificationResult {
  status: VerificationStatus;
  verifiedAt: number;
  error?: string;
}

/**
 * Progress state for verification operations
 */
export interface VerificationProgress {
  isRunning: boolean;
  type: "mining" | "stacking" | null;
  city: CityName | null;
  current: number;
  total: number;
  currentItem: string; // e.g., "Block 12345" or "Cycle 42"
}

/**
 * Entry identifier for cache lookup
 */
export interface EntryKey {
  city: CityName;
  version: Version;
  type: "mining" | "stacking";
  id: number; // block height or cycle number
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a cache key for an entry
 */
function createCacheKey(entry: EntryKey): string {
  return `${entry.city}-${entry.version}-${entry.type}-${entry.id}`;
}

/**
 * Parse a cache key back to entry key
 */
function parseCacheKey(key: string): EntryKey | null {
  const parts = key.split("-");
  if (parts.length !== 4) return null;

  const [city, version, type, id] = parts;
  if (!["mia", "nyc"].includes(city)) return null;
  if (!["legacyV1", "legacyV2", "daoV1", "daoV2"].includes(version)) return null;
  if (!["mining", "stacking"].includes(type)) return null;

  return {
    city: city as CityName,
    version: version as Version,
    type: type as "mining" | "stacking",
    id: parseInt(id, 10),
  };
}

// =============================================================================
// ATOMS
// =============================================================================

/**
 * Persistent verification cache - keyed by Stacks address
 *
 * Top-level keys are Stacks addresses
 * Second-level keys are "city-version-type-id" (e.g., "mia-legacyV1-mining-12345")
 * Values are verification results with timestamps
 *
 * Structure: { [stxAddress]: { [entryKey]: VerificationResult } }
 */
export const verificationCacheByAddressAtom = atomWithStorage<
  Record<string, Record<string, VerificationResult>>
>("citycoins-verification-cache-v2", {});

/**
 * Derived atom that provides the verification cache for the current address
 * This is the main atom used by the rest of the app
 *
 * The setter automatically broadcasts updates to other tabs via BroadcastChannel.
 */
export const verificationCacheAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    const cacheByAddress = get(verificationCacheByAddressAtom);
    if (!address) return {};
    return cacheByAddress[address] || {};
  },
  (get, set, newCache: Record<string, VerificationResult>) => {
    const address = get(stxAddressAtom);
    if (!address) return;

    // Get old cache to determine what changed
    const cacheByAddress = get(verificationCacheByAddressAtom);
    const oldCache = cacheByAddress[address] || {};

    // Update the cache
    set(verificationCacheByAddressAtom, {
      ...cacheByAddress,
      [address]: newCache,
    });

    // Find entries that changed (for broadcasting)
    const changedEntries: Record<string, VerificationResult> = {};
    for (const [key, result] of Object.entries(newCache)) {
      const oldResult = oldCache[key];
      // Broadcast if entry is new or status changed (not just verifying -> verifying)
      if (
        !oldResult ||
        oldResult.status !== result.status ||
        result.verifiedAt > oldResult.verifiedAt
      ) {
        // Only broadcast final states, not "verifying" progress updates
        if (result.status !== "verifying") {
          changedEntries[key] = result;
        }
      }
    }

    // Broadcast changes to other tabs (if any)
    if (Object.keys(changedEntries).length > 0) {
      broadcastVerificationUpdate(address, changedEntries);
    }
  }
);

/**
 * Action atom to handle incoming broadcast messages from other tabs.
 *
 * This merges verification results from other tabs into the local cache
 * using a "newer wins" strategy based on verifiedAt timestamps.
 *
 * Note: Updates are written directly to verificationCacheByAddressAtom
 * (bypassing verificationCacheAtom setter) to avoid re-broadcasting
 * incoming messages back to other tabs.
 */
export const handleBroadcastMessageAtom = atom(
  null,
  (get, set, message: BroadcastMessage<VerificationUpdatePayload>) => {
    const address = get(stxAddressAtom);
    if (!address) return;

    // Only process messages for the current address
    if (message.address !== address) {
      return;
    }

    // Validate message structure
    if (!isVerificationUpdateMessage(message)) {
      return;
    }

    const currentCache = get(verificationCacheAtom);
    const incomingEntries = message.payload.entries;

    // Merge incoming entries with current cache
    const mergedCache = mergeVerificationEntries(currentCache, incomingEntries);

    // Only update if there were actual changes
    if (mergedCache !== currentCache) {
      // Update directly to storage atom to avoid triggering broadcast
      // (verificationCacheAtom setter broadcasts, but we're receiving, not sending)
      const cacheByAddress = get(verificationCacheByAddressAtom);
      set(verificationCacheByAddressAtom, {
        ...cacheByAddress,
        [address]: mergedCache,
      });
    }
  }
);

/**
 * Subscription management for broadcast sync.
 * Store the unsubscribe function so we can clean up on disconnect.
 */
let broadcastUnsubscribe: Unsubscribe | null = null;

/**
 * Action atom to initialize cross-tab synchronization.
 *
 * Call this once when the app mounts or when a wallet connects.
 * It subscribes to broadcast messages from other tabs and merges
 * incoming verification updates into the local cache.
 *
 * @returns true if subscription was set up, false if already subscribed
 */
export const initBroadcastSyncAtom = atom(null, (get, set) => {
  // Already subscribed
  if (broadcastUnsubscribe) {
    return false;
  }

  broadcastUnsubscribe = subscribeToBroadcasts((message) => {
    // Type guard for verification updates
    if (isVerificationUpdateMessage(message)) {
      set(
        handleBroadcastMessageAtom,
        message as BroadcastMessage<VerificationUpdatePayload>
      );
    }
  });

  return true;
});

/**
 * Action atom to clean up cross-tab synchronization.
 *
 * Call this when the app unmounts or when a wallet disconnects.
 */
export const cleanupBroadcastSyncAtom = atom(null, () => {
  if (broadcastUnsubscribe) {
    broadcastUnsubscribe();
    broadcastUnsubscribe = null;
  }
});

/**
 * Current verification progress
 */
export const verificationProgressAtom = atom<VerificationProgress>({
  isRunning: false,
  type: null,
  city: null,
  current: 0,
  total: 0,
  currentItem: "",
});

// =============================================================================
// READ ATOMS
// =============================================================================

/**
 * Get verification result for a mining entry
 */
export const getMiningVerificationAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entry: MiningEntry): VerificationResult | null => {
    const key = createCacheKey({
      city: entry.city,
      version: entry.version,
      type: "mining",
      id: entry.block,
    });
    return cache[key] || null;
  };
});

/**
 * Get verification result for a stacking entry
 */
export const getStackingVerificationAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entry: StackingEntry): VerificationResult | null => {
    const key = createCacheKey({
      city: entry.city,
      version: entry.version,
      type: "stacking",
      id: entry.cycle,
    });
    return cache[key] || null;
  };
});

// =============================================================================
// ACTION ATOMS - MINING VERIFICATION
// =============================================================================

/**
 * Verify a single mining entry
 */
export const verifySingleMiningAtom = atom(
  null,
  async (get, set, entry: MiningEntry) => {
    const address = get(stxAddressAtom);
    if (!address) return;

    const cache = get(verificationCacheAtom);
    const key = createCacheKey({
      city: entry.city,
      version: entry.version,
      type: "mining",
      id: entry.block,
    });

    // Mark as verifying
    set(verificationCacheAtom, {
      ...cache,
      [key]: { status: "verifying", verifiedAt: Date.now() },
    });

    set(verificationProgressAtom, {
      isRunning: true,
      type: "mining",
      city: entry.city,
      current: 1,
      total: 1,
      currentItem: `Block ${entry.block}`,
    });

    try {
      const result = await verifyMiningClaim(
        entry.city,
        entry.version,
        address,
        entry.block
      );

      const updatedCache = get(verificationCacheAtom);

      if (result.success) {
        const { canClaim, isClaimed, isWinner } = result.data;
        let status: VerificationStatus;

        if (isClaimed) {
          status = "claimed";
        } else if (canClaim) {
          status = "claimable";
        } else if (!isWinner) {
          status = "not-won";
        } else {
          status = "not-won"; // Winner but can't claim = already claimed
        }

        set(verificationCacheAtom, {
          ...updatedCache,
          [key]: { status, verifiedAt: Date.now() },
        });
      } else {
        set(verificationCacheAtom, {
          ...updatedCache,
          [key]: {
            status: "error",
            verifiedAt: Date.now(),
            error: result.error.message,
          },
        });
      }
    } catch (error) {
      const updatedCache = get(verificationCacheAtom);
      set(verificationCacheAtom, {
        ...updatedCache,
        [key]: {
          status: "error",
          verifiedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });
  }
);

/**
 * Verify all unverified mining entries for a city
 *
 * Uses batch cache updates: collects all verification results during processing,
 * then applies a single cache update at the end. This reduces complexity from
 * O(n*k) to O(n+k) where n = entries to verify, k = cache size.
 *
 * Note: "verifying" status is still set per-entry for UI feedback during long operations.
 */
export const verifyAllMiningAtom = atom(
  null,
  async (get, set, params: { city: CityName; entries: MiningEntry[] }) => {
    const { city, entries } = params;
    const address = get(stxAddressAtom);
    if (!address) return;

    const cache = get(verificationCacheAtom);

    // Filter to only unverified entries
    const unverified = entries.filter((entry) => {
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });
      const result = cache[key];
      return !result || result.status === "unverified" || result.status === "error";
    });

    if (unverified.length === 0) {
      return;
    }

    set(verificationProgressAtom, {
      isRunning: true,
      type: "mining",
      city,
      current: 0,
      total: unverified.length,
      currentItem: "",
    });

    // Collect all verification results for batch cache update
    const batchUpdates: Record<string, VerificationResult> = {};

    // Process entries one by one (rate limited by hiroFetch)
    for (let i = 0; i < unverified.length; i++) {
      const entry = unverified[i];
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });

      // Update progress for UI feedback
      set(verificationProgressAtom, (prev) => ({
        ...prev,
        current: i + 1,
        currentItem: `Block ${entry.block}`,
      }));

      // Mark as verifying for UI indication (individual update for real-time feedback)
      const currentCache = get(verificationCacheAtom);
      set(verificationCacheAtom, {
        ...currentCache,
        [key]: { status: "verifying", verifiedAt: Date.now() },
      });

      try {
        const result = await verifyMiningClaim(
          entry.city,
          entry.version,
          address,
          entry.block
        );

        if (result.success) {
          const { canClaim, isClaimed, isWinner } = result.data;
          let status: VerificationStatus;

          if (isClaimed) {
            status = "claimed";
          } else if (canClaim) {
            status = "claimable";
          } else if (!isWinner) {
            status = "not-won";
          } else {
            status = "not-won";
          }

          // Collect result for batch update
          batchUpdates[key] = { status, verifiedAt: Date.now() };
        } else {
          batchUpdates[key] = {
            status: "error",
            verifiedAt: Date.now(),
            error: result.error.message,
          };
        }
      } catch (error) {
        batchUpdates[key] = {
          status: "error",
          verifiedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Apply all results in a single batch cache update - O(k) instead of O(n*k)
    const finalCache = get(verificationCacheAtom);
    set(verificationCacheAtom, { ...finalCache, ...batchUpdates });

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });
  }
);

// =============================================================================
// ACTION ATOMS - STACKING VERIFICATION
// =============================================================================

/**
 * Verify a single stacking entry
 */
export const verifySingleStackingAtom = atom(
  null,
  async (get, set, entry: StackingEntry) => {
    const userIds = get(userIdsAtom);
    if (!userIds) {
      return;
    }

    const userId = getUserIdForVersion(userIds, entry.city, entry.version);
    if (userId === null) {
      return;
    }

    const cache = get(verificationCacheAtom);
    const key = createCacheKey({
      city: entry.city,
      version: entry.version,
      type: "stacking",
      id: entry.cycle,
    });

    // Mark as verifying
    set(verificationCacheAtom, {
      ...cache,
      [key]: { status: "verifying", verifiedAt: Date.now() },
    });

    set(verificationProgressAtom, {
      isRunning: true,
      type: "stacking",
      city: entry.city,
      current: 1,
      total: 1,
      currentItem: `Cycle ${entry.cycle}`,
    });

    try {
      const result = await verifyStackingClaim(
        entry.city,
        entry.version,
        userId,
        entry.cycle
      );

      const updatedCache = get(verificationCacheAtom);

      if (result.success) {
        const { reward, canClaim } = result.data;
        const status: VerificationStatus = canClaim ? "claimable" : "no-reward";

        set(verificationCacheAtom, {
          ...updatedCache,
          [key]: { status, verifiedAt: Date.now() },
        });
      } else {
        set(verificationCacheAtom, {
          ...updatedCache,
          [key]: {
            status: "error",
            verifiedAt: Date.now(),
            error: result.error.message,
          },
        });
      }
    } catch (error) {
      const updatedCache = get(verificationCacheAtom);
      set(verificationCacheAtom, {
        ...updatedCache,
        [key]: {
          status: "error",
          verifiedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });
  }
);

/**
 * Verify all unverified stacking entries for a city
 *
 * Uses batch cache updates: collects all verification results during processing,
 * then applies a single cache update at the end. This reduces complexity from
 * O(n*k) to O(n+k) where n = entries to verify, k = cache size.
 *
 * Note: "verifying" status is still set per-entry for UI feedback during long operations.
 */
export const verifyAllStackingAtom = atom(
  null,
  async (get, set, params: { city: CityName; entries: StackingEntry[] }) => {
    const { city, entries } = params;
    const userIds = get(userIdsAtom);
    if (!userIds) {
      return;
    }

    const cache = get(verificationCacheAtom);

    // Filter to only unverified entries that have a user ID
    const unverified = entries.filter((entry) => {
      const userId = getUserIdForVersion(userIds, entry.city, entry.version);
      if (userId === null) return false;

      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });
      const result = cache[key];
      return !result || result.status === "unverified" || result.status === "error";
    });

    if (unverified.length === 0) {
      return;
    }

    set(verificationProgressAtom, {
      isRunning: true,
      type: "stacking",
      city,
      current: 0,
      total: unverified.length,
      currentItem: "",
    });

    // Collect all verification results for batch cache update
    const batchUpdates: Record<string, VerificationResult> = {};

    // Process entries one by one (rate limited by hiroFetch)
    for (let i = 0; i < unverified.length; i++) {
      const entry = unverified[i];
      const userId = getUserIdForVersion(userIds, entry.city, entry.version)!;
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });

      // Update progress for UI feedback
      set(verificationProgressAtom, (prev) => ({
        ...prev,
        current: i + 1,
        currentItem: `Cycle ${entry.cycle}`,
      }));

      // Mark as verifying for UI indication (individual update for real-time feedback)
      const currentCache = get(verificationCacheAtom);
      set(verificationCacheAtom, {
        ...currentCache,
        [key]: { status: "verifying", verifiedAt: Date.now() },
      });

      try {
        const result = await verifyStackingClaim(
          entry.city,
          entry.version,
          userId,
          entry.cycle
        );

        if (result.success) {
          const { canClaim } = result.data;
          const status: VerificationStatus = canClaim ? "claimable" : "no-reward";

          // Collect result for batch update
          batchUpdates[key] = { status, verifiedAt: Date.now() };
        } else {
          batchUpdates[key] = {
            status: "error",
            verifiedAt: Date.now(),
            error: result.error.message,
          };
        }
      } catch (error) {
        batchUpdates[key] = {
          status: "error",
          verifiedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Apply all results in a single batch cache update - O(k) instead of O(n*k)
    const finalCache = get(verificationCacheAtom);
    set(verificationCacheAtom, { ...finalCache, ...batchUpdates });

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });
  }
);

// =============================================================================
// ACTION ATOMS - RETRY FAILED
// =============================================================================

/**
 * Retry all failed mining verifications for a city
 */
export const retryFailedMiningAtom = atom(
  null,
  async (get, set, params: { city: CityName; entries: MiningEntry[] }) => {
    const { city, entries } = params;
    const cache = get(verificationCacheAtom);

    // Filter to only failed entries
    const failed = entries.filter((entry) => {
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });
      const result = cache[key];
      return result?.status === "error";
    });

    if (failed.length === 0) return;

    // Clear error status so they get re-verified
    const updatedCache = { ...cache };
    for (const entry of failed) {
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });
      delete updatedCache[key];
    }
    set(verificationCacheAtom, updatedCache);

    // Now verify them
    await set(verifyAllMiningAtom, { city, entries: failed });
  }
);

/**
 * Retry all failed stacking verifications for a city
 */
export const retryFailedStackingAtom = atom(
  null,
  async (get, set, params: { city: CityName; entries: StackingEntry[] }) => {
    const { city, entries } = params;
    const cache = get(verificationCacheAtom);

    // Filter to only failed entries
    const failed = entries.filter((entry) => {
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });
      const result = cache[key];
      return result?.status === "error";
    });

    if (failed.length === 0) return;

    // Clear error status so they get re-verified
    const updatedCache = { ...cache };
    for (const entry of failed) {
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });
      delete updatedCache[key];
    }
    set(verificationCacheAtom, updatedCache);

    // Now verify them
    await set(verifyAllStackingAtom, { city, entries: failed });
  }
);

// =============================================================================
// SUMMARY ATOMS
// =============================================================================

/**
 * Get verification summary for mining entries
 *
 * This summary accounts for:
 * 1. Entry status from transaction history (claimed/not-won from claim txs)
 * 2. Verification cache results (from manual verification)
 * 3. Base status (pending/unverified)
 */
export const miningVerificationSummaryAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entries: MiningEntry[]) => {
    let pending = 0;
    let unverified = 0;
    let verifying = 0;
    let claimable = 0;
    let notWon = 0;
    let claimed = 0;
    let error = 0;

    for (const entry of entries) {
      // First check: entry status from transaction history takes priority
      if (entry.status === "claimed") {
        claimed++;
        continue;
      }
      if (entry.status === "not-won") {
        notWon++;
        continue;
      }
      if (entry.status === "pending") {
        pending++;
        continue;
      }

      // Second check: verification cache
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });
      const result = cache[key];

      if (!result || result.status === "unverified") {
        unverified++;
      } else {
        switch (result.status) {
          case "verifying":
            verifying++;
            break;
          case "claimable":
            claimable++;
            break;
          case "not-won":
            notWon++;
            break;
          case "claimed":
            claimed++;
            break;
          case "error":
            error++;
            break;
        }
      }
    }

    return { pending, unverified, verifying, claimable, notWon, claimed, error, total: entries.length };
  };
});

/**
 * Get verification summary for stacking entries
 *
 * This summary accounts for:
 * 1. Entry status from transaction history (claimed from claim txs)
 * 2. Verification cache results (from manual verification)
 * 3. Base status (locked/unverified)
 */
export const stackingVerificationSummaryAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entries: StackingEntry[]) => {
    let locked = 0;
    let unverified = 0;
    let verifying = 0;
    let claimable = 0;
    let noReward = 0;
    let claimed = 0;
    let error = 0;

    for (const entry of entries) {
      // First check: entry status from transaction history takes priority
      if (entry.status === "claimed") {
        claimed++;
        continue;
      }
      if (entry.status === "locked") {
        locked++;
        continue;
      }

      // Second check: verification cache
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });
      const result = cache[key];

      if (!result || result.status === "unverified") {
        unverified++;
      } else {
        switch (result.status) {
          case "verifying":
            verifying++;
            break;
          case "claimable":
            claimable++;
            break;
          case "no-reward":
            noReward++;
            break;
          case "claimed":
            claimed++;
            break;
          case "error":
            error++;
            break;
        }
      }
    }

    return { locked, unverified, verifying, claimable, noReward, claimed, error, total: entries.length };
  };
});
