/**
 * Unified Claim Verification Utility
 *
 * Provides a single interface for verifying mining and stacking claims
 * across all contract versions (legacyV1, legacyV2, daoV1, daoV2).
 *
 * Routes to the appropriate API (legacy or protocol) based on version.
 */

import { CityName, Version } from "../config/city-config";
import * as legacyApi from "./citycoins-legacy-api";
import * as protocolApi from "./citycoins-protocol-api";

// =============================================================================
// TYPES
// =============================================================================

export interface MiningClaimVerification {
  isWinner: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

export interface StackingClaimVerification {
  reward: number;
  canClaim: boolean;
}

export interface VerificationError {
  message: string;
  status?: number;
}

export type VerificationResult<T> =
  | { success: true; data: T }
  | { success: false; error: VerificationError };

// =============================================================================
// MINING VERIFICATION
// =============================================================================

/**
 * Verify if a user can claim a mining reward for a specific block.
 *
 * Routes to the appropriate API based on contract version:
 * - legacyV1/legacyV2: Uses api.citycoins.co
 * - daoV1/daoV2: Uses protocol.citycoins.co/api
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version
 * @param userAddress - User's Stacks address
 * @param blockHeight - The block height to verify
 * @returns Verification result with claim status
 */
export async function verifyMiningClaim(
  city: CityName,
  version: Version,
  userAddress: string,
  blockHeight: number
): Promise<VerificationResult<MiningClaimVerification>> {
  try {
    if (legacyApi.isLegacyVersion(version)) {
      // Legacy API: can-claim-mining-reward returns a simple boolean
      const result = await legacyApi.canClaimMiningReward(
        city,
        version,
        blockHeight,
        userAddress
      );

      if (!result.ok) {
        return {
          success: false,
          error: { message: result.error || "API request failed", status: result.status },
        };
      }

      const canClaim = result.data?.canClaim ?? false;

      // For legacy, if canClaim is true, user is winner and hasn't claimed
      // If canClaim is false, we need to check if they won but already claimed
      // or if they just didn't win at all
      if (canClaim) {
        return {
          success: true,
          data: { isWinner: true, isClaimed: false, canClaim: true },
        };
      }

      // Check if they were the winner (to distinguish claimed vs not-won)
      const winnerResult = await legacyApi.isBlockWinner(
        city,
        version,
        blockHeight,
        userAddress
      );

      if (!winnerResult.ok) {
        // If winner check fails, assume not-won (conservative)
        return {
          success: true,
          data: { isWinner: false, isClaimed: false, canClaim: false },
        };
      }

      const isWinner = winnerResult.data ?? false;

      return {
        success: true,
        data: {
          isWinner,
          isClaimed: isWinner, // If winner but can't claim, must be claimed
          canClaim: false,
        },
      };
    }

    if (protocolApi.isDaoVersion(version)) {
      // Protocol API: is-block-winner returns { winner, claimed }
      const result = await protocolApi.isBlockWinner(
        city,
        version,
        userAddress,
        blockHeight
      );

      if (!result.ok) {
        return {
          success: false,
          error: { message: result.error || "API request failed", status: result.status },
        };
      }

      return {
        success: true,
        data: result.data ?? { isWinner: false, isClaimed: false, canClaim: false },
      };
    }

    return {
      success: false,
      error: { message: `Unknown version: ${version}` },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// =============================================================================
// STACKING VERIFICATION
// =============================================================================

/**
 * Verify if a user can claim a stacking reward for a specific cycle.
 *
 * Routes to the appropriate API based on contract version:
 * - legacyV1/legacyV2: Uses api.citycoins.co
 * - daoV1/daoV2: Uses protocol.citycoins.co/api
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version
 * @param userId - User's ID (from getUserId)
 * @param cycle - Reward cycle number
 * @returns Verification result with reward amount
 */
export async function verifyStackingClaim(
  city: CityName,
  version: Version,
  userId: number,
  cycle: number
): Promise<VerificationResult<StackingClaimVerification>> {
  try {
    if (legacyApi.isLegacyVersion(version)) {
      const result = await legacyApi.getStackingReward(city, version, userId, cycle);

      if (!result.ok) {
        return {
          success: false,
          error: { message: result.error || "API request failed", status: result.status },
        };
      }

      const reward = result.data?.reward ?? 0;

      return {
        success: true,
        data: { reward, canClaim: reward > 0 },
      };
    }

    if (protocolApi.isDaoVersion(version)) {
      const result = await protocolApi.getStackingReward(city, userId, cycle);

      if (!result.ok) {
        return {
          success: false,
          error: { message: result.error || "API request failed", status: result.status },
        };
      }

      const reward = result.data?.reward ?? 0;

      return {
        success: true,
        data: { reward, canClaim: reward > 0 },
      };
    }

    return {
      success: false,
      error: { message: `Unknown version: ${version}` },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// =============================================================================
// USER ID LOOKUP
// =============================================================================

export interface UserIds {
  legacy: {
    mia: { v1: number | null; v2: number | null };
    nyc: { v1: number | null; v2: number | null };
  };
  dao: number | null;
}

/**
 * Fetch all user IDs for an address.
 *
 * Fetches from:
 * - Legacy API: Per-city, per-version user IDs
 * - Protocol API: Shared DAO user ID from ccd003
 *
 * @param address - User's Stacks address
 * @returns All user IDs or null if all lookups failed
 */
export async function fetchAllUserIds(
  address: string
): Promise<VerificationResult<UserIds>> {
  try {
    // Fetch all user IDs sequentially (rate limited)
    const miaV1 = await legacyApi.getUserId("mia", "legacyV1", address);
    const miaV2 = await legacyApi.getUserId("mia", "legacyV2", address);
    const nycV1 = await legacyApi.getUserId("nyc", "legacyV1", address);
    const nycV2 = await legacyApi.getUserId("nyc", "legacyV2", address);
    const daoResult = await protocolApi.getUserId(address);

    return {
      success: true,
      data: {
        legacy: {
          mia: {
            v1: miaV1.ok ? miaV1.data?.userId ?? null : null,
            v2: miaV2.ok ? miaV2.data?.userId ?? null : null,
          },
          nyc: {
            v1: nycV1.ok ? nycV1.data?.userId ?? null : null,
            v2: nycV2.ok ? nycV2.data?.userId ?? null : null,
          },
        },
        dao: daoResult.ok ? daoResult.data?.userId ?? null : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Get the user ID for a specific city/version combination.
 *
 * @param userIds - All user IDs (from fetchAllUserIds)
 * @param city - City name
 * @param version - Contract version
 * @returns The user ID or null if not found
 */
export function getUserIdForVersion(
  userIds: UserIds,
  city: CityName,
  version: Version
): number | null {
  switch (version) {
    case "legacyV1":
      return userIds.legacy[city].v1;
    case "legacyV2":
      return userIds.legacy[city].v2;
    case "daoV1":
    case "daoV2":
      return userIds.dao;
    default:
      return null;
  }
}
