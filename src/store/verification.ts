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
    const cacheByAddress = get(verificationCacheByAddressAtom);
    set(verificationCacheByAddressAtom, {
      ...cacheByAddress,
      [address]: newCache,
    });
  }
);

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
