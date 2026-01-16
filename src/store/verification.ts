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
 * Persistent verification cache
 *
 * Keys are "city-version-type-id" (e.g., "mia-legacyV1-mining-12345")
 * Values are verification results with timestamps
 */
export const verificationCacheAtom = atomWithStorage<
  Record<string, VerificationResult>
>("citycoins-verification-cache", {});

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
      console.log("[verifyAllMining] No unverified entries");
      return;
    }

    console.log(`[verifyAllMining] Verifying ${unverified.length} entries for ${city}`);

    set(verificationProgressAtom, {
      isRunning: true,
      type: "mining",
      city,
      current: 0,
      total: unverified.length,
      currentItem: "",
    });

    // Process entries one by one (rate limited)
    for (let i = 0; i < unverified.length; i++) {
      const entry = unverified[i];
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "mining",
        id: entry.block,
      });

      // Update progress
      set(verificationProgressAtom, (prev) => ({
        ...prev,
        current: i + 1,
        currentItem: `Block ${entry.block}`,
      }));

      // Mark as verifying
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
            status = "not-won";
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
    }

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });

    console.log(`[verifyAllMining] Completed verification for ${city}`);
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
      console.log("[verifySingleStacking] No user IDs available");
      return;
    }

    const userId = getUserIdForVersion(userIds, entry.city, entry.version);
    if (userId === null) {
      console.log("[verifySingleStacking] No user ID for", entry.city, entry.version);
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
 */
export const verifyAllStackingAtom = atom(
  null,
  async (get, set, params: { city: CityName; entries: StackingEntry[] }) => {
    const { city, entries } = params;
    const userIds = get(userIdsAtom);
    if (!userIds) {
      console.log("[verifyAllStacking] No user IDs available");
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
      console.log("[verifyAllStacking] No unverified entries");
      return;
    }

    console.log(`[verifyAllStacking] Verifying ${unverified.length} entries for ${city}`);

    set(verificationProgressAtom, {
      isRunning: true,
      type: "stacking",
      city,
      current: 0,
      total: unverified.length,
      currentItem: "",
    });

    // Process entries one by one (rate limited)
    for (let i = 0; i < unverified.length; i++) {
      const entry = unverified[i];
      const userId = getUserIdForVersion(userIds, entry.city, entry.version)!;
      const key = createCacheKey({
        city: entry.city,
        version: entry.version,
        type: "stacking",
        id: entry.cycle,
      });

      // Update progress
      set(verificationProgressAtom, (prev) => ({
        ...prev,
        current: i + 1,
        currentItem: `Cycle ${entry.cycle}`,
      }));

      // Mark as verifying
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
    }

    set(verificationProgressAtom, {
      isRunning: false,
      type: null,
      city: null,
      current: 0,
      total: 0,
      currentItem: "",
    });

    console.log(`[verifyAllStacking] Completed verification for ${city}`);
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
 */
export const miningVerificationSummaryAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entries: MiningEntry[]) => {
    let unverified = 0;
    let verifying = 0;
    let claimable = 0;
    let notWon = 0;
    let claimed = 0;
    let error = 0;

    for (const entry of entries) {
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

    return { unverified, verifying, claimable, notWon, claimed, error, total: entries.length };
  };
});

/**
 * Get verification summary for stacking entries
 */
export const stackingVerificationSummaryAtom = atom((get) => {
  const cache = get(verificationCacheAtom);

  return (entries: StackingEntry[]) => {
    let unverified = 0;
    let verifying = 0;
    let claimable = 0;
    let noReward = 0;
    let claimed = 0;
    let error = 0;

    for (const entry of entries) {
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

    return { unverified, verifying, claimable, noReward, claimed, error, total: entries.length };
  };
});
