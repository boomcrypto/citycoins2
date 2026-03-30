/**
 * CityCoins Legacy API Client
 *
 * Provides typed access to legacy v1/v2 contract data.
 * Now uses direct contract reads instead of api.citycoins.co middleware.
 *
 * Used for: legacyV1, legacyV2 contract versions
 */

import { CityName } from "../config/city-config";
import {
  legacyCanClaimMiningReward,
  legacyIsBlockWinner,
  legacyGetStackingReward,
  legacyGetUserId,
} from "./contract-reads";

// =============================================================================
// TYPES (maintained for backward compatibility)
// =============================================================================

type LegacyVersion = "legacyV1" | "legacyV2";

/** Result type for API-like responses */
export interface RateLimitedFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/** Mining claim check result */
export interface LegacyMiningClaimResult {
  canClaim: boolean;
}

/** Stacking reward result */
export interface LegacyStackingRewardResult {
  reward: number;
}

/** User ID result */
export interface LegacyUserIdResult {
  userId: number | null;
}

// =============================================================================
// MINING CLAIMS
// =============================================================================

/**
 * Check if a user can claim a mining reward for a specific block.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param blockHeight - The block height to check
 * @param address - User's Stacks address
 * @returns Whether the user can claim the mining reward
 */
export async function canClaimMiningReward(
  city: CityName,
  version: LegacyVersion,
  blockHeight: number,
  address: string
): Promise<RateLimitedFetchResult<LegacyMiningClaimResult>> {
  const result = await legacyCanClaimMiningReward(city, version, blockHeight, address);

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: { canClaim: result.data === true },
  };
}

/**
 * Check if a user is the block winner for a specific block.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param blockHeight - The block height to check
 * @param address - User's Stacks address
 * @returns Whether the user is the block winner
 */
export async function isBlockWinner(
  city: CityName,
  version: LegacyVersion,
  blockHeight: number,
  address: string
): Promise<RateLimitedFetchResult<boolean>> {
  const result = await legacyIsBlockWinner(city, version, blockHeight, address);

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: result.data === true,
  };
}

// =============================================================================
// STACKING CLAIMS
// =============================================================================

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * Note: Requires userId, not address. Use getUserId() first.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param userId - User's ID in the contract
 * @param cycle - Reward cycle number
 * @returns The stacking reward amount (in micro units)
 */
export async function getStackingReward(
  city: CityName,
  version: LegacyVersion,
  userId: number,
  cycle: number
): Promise<RateLimitedFetchResult<LegacyStackingRewardResult>> {
  const result = await legacyGetStackingReward(city, version, userId, cycle);

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: { reward: result.data || 0 },
  };
}

// =============================================================================
// USER REGISTRY
// =============================================================================

/**
 * Get a user's ID from their address.
 *
 * Note: User IDs are registered when users first interact with the contract.
 * Returns null if user has never interacted with the contract.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param address - User's Stacks address
 * @returns The user's ID or null if not found
 */
export async function getUserId(
  city: CityName,
  version: LegacyVersion,
  address: string
): Promise<RateLimitedFetchResult<LegacyUserIdResult>> {
  const result = await legacyGetUserId(city, version, address);

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  // null userId is a valid response (user not found)
  if (result.data === null) {
    return {
      ok: true,
      status: 404,
      data: { userId: null },
    };
  }

  return {
    ok: true,
    status: 200,
    data: { userId: result.data },
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a version is a legacy version
 */
export function isLegacyVersion(version: string): version is LegacyVersion {
  return version === "legacyV1" || version === "legacyV2";
}
