/**
 * CityCoins Protocol API Client
 *
 * Provides typed access to DAO v1/v2 contract data.
 * Now uses direct contract reads instead of protocol.citycoins.co middleware.
 *
 * Used for: daoV1, daoV2 contract versions
 */

import { CityName } from "../config/city-config";
import {
  daoIsBlockWinner,
  daoGetMiningStats,
  daoGetStackingReward,
  daoGetStacker,
  daoIsCyclePaid,
  daoGetCurrentRewardCycle,
  daoGetUserId,
} from "./contract-reads";

// =============================================================================
// TYPES (maintained for backward compatibility)
// =============================================================================

type DaoVersion = "daoV1" | "daoV2";

/** Result type for API-like responses */
export interface RateLimitedFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/** Block winner status from the DAO contract */
export interface BlockWinnerResult {
  winner: boolean;
  claimed: boolean;
}

/** Stacker info from the DAO contract */
export interface StackerResult {
  stacked: number;
  claimable: number;
}

/** Mining claim check result (normalized for our UI) */
export interface DaoMiningClaimResult {
  isWinner: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

/** Stacking reward result */
export interface DaoStackingRewardResult {
  reward: number;
}

/** User ID result */
export interface DaoUserIdResult {
  userId: number | null;
}

// =============================================================================
// MINING CLAIMS
// =============================================================================

/**
 * Check if a user is the block winner and if they've claimed.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (daoV1 or daoV2)
 * @param userAddress - User's Stacks address
 * @param claimHeight - The block height to check
 * @returns Winner status and claim status
 */
export async function isBlockWinner(
  city: CityName,
  version: DaoVersion,
  userAddress: string,
  claimHeight: number
): Promise<RateLimitedFetchResult<DaoMiningClaimResult>> {
  const result = await daoIsBlockWinner(city, version, userAddress, claimHeight);

  if (!result.ok || !result.data) {
    // Contract errors treated as "user didn't participate"
    return {
      ok: true,
      status: 404,
      data: { isWinner: false, isClaimed: false, canClaim: false },
    };
  }

  const { isWinner, isClaimed } = result.data;

  return {
    ok: true,
    status: 200,
    data: {
      isWinner,
      isClaimed,
      canClaim: isWinner && !isClaimed,
    },
  };
}

/**
 * Get mining statistics for a block.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (daoV1 or daoV2)
 * @param height - The block height
 * @returns Mining statistics
 */
export async function getMiningStats(
  city: CityName,
  version: DaoVersion,
  height: number
): Promise<RateLimitedFetchResult<{ miners: number; amount: number; claimed: boolean }>> {
  const result = await daoGetMiningStats(city, version, height);

  if (!result.ok || !result.data) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: result.data,
  };
}

// =============================================================================
// STACKING CLAIMS
// =============================================================================

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * @param city - City name (mia or nyc)
 * @param userId - User's ID from ccd003-user-registry
 * @param cycle - Reward cycle number
 * @returns The stacking reward amount (in micro units)
 */
export async function getStackingReward(
  city: CityName,
  userId: number,
  cycle: number
): Promise<RateLimitedFetchResult<DaoStackingRewardResult>> {
  const result = await daoGetStackingReward(city, userId, cycle);

  if (!result.ok) {
    // No reward is a valid response
    return {
      ok: true,
      status: 404,
      data: { reward: 0 },
    };
  }

  return {
    ok: true,
    status: 200,
    data: { reward: result.data || 0 },
  };
}

/**
 * Get stacker info for a user in a specific cycle.
 *
 * @param city - City name (mia or nyc)
 * @param userId - User's ID from ccd003-user-registry
 * @param cycle - Reward cycle number
 * @returns Stacker info (stacked amount, claimable amount)
 */
export async function getStacker(
  city: CityName,
  userId: number,
  cycle: number
): Promise<RateLimitedFetchResult<StackerResult>> {
  const result = await daoGetStacker(city, userId, cycle);

  if (!result.ok || !result.data) {
    // User didn't stack in this cycle
    return {
      ok: true,
      status: 404,
      data: { stacked: 0, claimable: 0 },
    };
  }

  return {
    ok: true,
    status: 200,
    data: result.data,
  };
}

/**
 * Check if a cycle has been paid out.
 *
 * @param city - City name (mia or nyc)
 * @param cycle - Reward cycle number
 * @returns Whether the cycle has been paid out
 */
export async function isCyclePaid(
  city: CityName,
  cycle: number
): Promise<RateLimitedFetchResult<boolean>> {
  const result = await daoIsCyclePaid(city, cycle);

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: result.data === true,
  };
}

/**
 * Get the current reward cycle.
 *
 * @returns The current reward cycle number
 */
export async function getCurrentRewardCycle(): Promise<RateLimitedFetchResult<number>> {
  const result = await daoGetCurrentRewardCycle();

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }

  return {
    ok: true,
    status: 200,
    data: result.data || 0,
  };
}

// =============================================================================
// USER REGISTRY (ccd003)
// =============================================================================

/**
 * Get a user's ID from their address.
 *
 * Note: This is the DAO user registry, shared across all cities.
 * User IDs are registered when users first interact with any DAO contract.
 * Returns null if user has never interacted with DAO contracts.
 *
 * @param address - User's Stacks address
 * @returns The user's ID or null if not found
 */
export async function getUserId(
  address: string
): Promise<RateLimitedFetchResult<DaoUserIdResult>> {
  const result = await daoGetUserId(address);

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
 * Check if a version is a DAO version
 */
export function isDaoVersion(version: string): version is DaoVersion {
  return version === "daoV1" || version === "daoV2";
}
