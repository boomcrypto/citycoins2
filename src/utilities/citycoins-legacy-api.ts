/**
 * CityCoins Legacy API Client
 *
 * Provides typed access to the CityCoins Legacy API endpoints.
 * Base URL: https://api.citycoins.co
 *
 * Used for: legacyV1, legacyV2 contract versions
 *
 * All requests go through the rate-limited fetch utility to ensure
 * we respect the underlying Hiro API rate limits.
 */

import { CityName } from "../config/city-config";
import { rateLimitedFetch, RateLimitedFetchResult } from "./rate-limited-fetch";

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_URL = "https://api.citycoins.co";

// Map our internal version names to API version paths
type LegacyVersion = "legacyV1" | "legacyV2";
const VERSION_MAP: Record<LegacyVersion, string> = {
  legacyV1: "v1",
  legacyV2: "v2",
};

// =============================================================================
// TYPES
// =============================================================================

/** Standard single-value response from the legacy API */
interface SingleValueResponse<T> {
  value: T;
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
 * Endpoint: GET /{version}/{city}/mining-claims/can-claim-mining-reward/{block}/{address}
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
  const v = VERSION_MAP[version];
  const url = `${BASE_URL}/${v}/${city}/mining-claims/can-claim-mining-reward/${blockHeight}/${address}`;

  const result = await rateLimitedFetch<SingleValueResponse<boolean>>(url);

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: { canClaim: result.data?.value === true },
  };
}

/**
 * Check if a user is the block winner for a specific block.
 *
 * Endpoint: GET /{version}/{city}/mining-claims/is-block-winner/{block}/{address}
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
  const v = VERSION_MAP[version];
  const url = `${BASE_URL}/${v}/${city}/mining-claims/is-block-winner/${blockHeight}/${address}`;

  const result = await rateLimitedFetch<SingleValueResponse<boolean>>(url);

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: result.data?.value === true,
  };
}

// =============================================================================
// STACKING CLAIMS
// =============================================================================

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * Endpoint: GET /{version}/{city}/stacking-claims/get-stacking-reward/{cycle}/{userId}
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
  const v = VERSION_MAP[version];
  const url = `${BASE_URL}/${v}/${city}/stacking-claims/get-stacking-reward/${cycle}/${userId}`;

  const result = await rateLimitedFetch<SingleValueResponse<number>>(url);

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: { reward: Number(result.data?.value) || 0 },
  };
}

// =============================================================================
// USER REGISTRY
// =============================================================================

/**
 * Get a user's ID from their address.
 *
 * Endpoint: GET /{version}/{city}/activation/get-user-id/{address}
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
  const v = VERSION_MAP[version];
  const url = `${BASE_URL}/${v}/${city}/activation/get-user-id/${address}`;

  const result = await rateLimitedFetch<SingleValueResponse<number>>(url);

  // 404 means user not found, which is a valid response (not an error)
  if (result.status === 404) {
    return {
      ok: true,
      status: 404,
      data: { userId: null },
    };
  }

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  const userId = result.data?.value;

  return {
    ok: true,
    status: result.status,
    data: { userId: userId ? Number(userId) : null },
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
