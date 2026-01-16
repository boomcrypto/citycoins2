/**
 * CityCoins Protocol API Client
 *
 * Provides typed access to the CityCoins Protocol/DAO API endpoints.
 * Base URL: https://protocol.citycoins.co/api
 *
 * Used for: daoV1, daoV2 contract versions
 *
 * All requests go through the rate-limited fetch utility to ensure
 * we respect the underlying Hiro API rate limits.
 */

import { CityName, CITY_IDS } from "../config/city-config";
import { rateLimitedFetch, RateLimitedFetchResult } from "./rate-limited-fetch";

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_URL = "https://protocol.citycoins.co/api";

// Map our internal version names to mining contract names
type DaoVersion = "daoV1" | "daoV2";
const MINING_CONTRACT_MAP: Record<DaoVersion, string> = {
  daoV1: "ccd006-citycoin-mining",
  daoV2: "ccd006-citycoin-mining-v2",
};

// =============================================================================
// TYPES
// =============================================================================

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
 * Endpoint: GET /ccd006-citycoin-mining{-v2}/is-block-winner
 * Query params: cityId, user, claimHeight
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
  const contract = MINING_CONTRACT_MAP[version];
  const cityId = CITY_IDS[city];
  const url = `${BASE_URL}/${contract}/is-block-winner?cityId=${cityId}&user=${userAddress}&claimHeight=${claimHeight}`;

  const result = await rateLimitedFetch<BlockWinnerResult>(url);

  // 404 means user didn't participate in this block
  if (result.status === 404) {
    return {
      ok: true,
      status: 404,
      data: { isWinner: false, isClaimed: false, canClaim: false },
    };
  }

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  const { winner, claimed } = result.data || { winner: false, claimed: false };

  return {
    ok: true,
    status: result.status,
    data: {
      isWinner: winner,
      isClaimed: claimed,
      canClaim: winner && !claimed,
    },
  };
}

/**
 * Get mining statistics for a block.
 *
 * Endpoint: GET /ccd006-citycoin-mining{-v2}/get-mining-stats
 * Query params: cityId, height
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
  const contract = MINING_CONTRACT_MAP[version];
  const cityId = CITY_IDS[city];
  const url = `${BASE_URL}/${contract}/get-mining-stats?cityId=${cityId}&height=${height}`;

  return await rateLimitedFetch(url);
}

// =============================================================================
// STACKING CLAIMS
// =============================================================================

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * Endpoint: GET /ccd007-citycoin-stacking/get-stacking-reward
 * Query params: cityId, cycle, userId
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
  const cityId = CITY_IDS[city];
  const url = `${BASE_URL}/ccd007-citycoin-stacking/get-stacking-reward?cityId=${cityId}&cycle=${cycle}&userId=${userId}`;

  const result = await rateLimitedFetch<number>(url);

  // 404 means no reward for this cycle
  if (result.status === 404) {
    return {
      ok: true,
      status: 404,
      data: { reward: 0 },
    };
  }

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: { reward: Number(result.data) || 0 },
  };
}

/**
 * Get stacker info for a user in a specific cycle.
 *
 * Endpoint: GET /ccd007-citycoin-stacking/get-stacker
 * Query params: cityId, cycle, userId
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
  const cityId = CITY_IDS[city];
  const url = `${BASE_URL}/ccd007-citycoin-stacking/get-stacker?cityId=${cityId}&cycle=${cycle}&userId=${userId}`;

  const result = await rateLimitedFetch<StackerResult>(url);

  // 404 means user didn't stack in this cycle
  if (result.status === 404) {
    return {
      ok: true,
      status: 404,
      data: { stacked: 0, claimable: 0 },
    };
  }

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return result;
}

/**
 * Check if a cycle has been paid out.
 *
 * Endpoint: GET /ccd007-citycoin-stacking/is-cycle-paid
 * Query params: cityId, cycle
 *
 * @param city - City name (mia or nyc)
 * @param cycle - Reward cycle number
 * @returns Whether the cycle has been paid out
 */
export async function isCyclePaid(
  city: CityName,
  cycle: number
): Promise<RateLimitedFetchResult<boolean>> {
  const cityId = CITY_IDS[city];
  const url = `${BASE_URL}/ccd007-citycoin-stacking/is-cycle-paid?cityId=${cityId}&cycle=${cycle}`;

  const result = await rateLimitedFetch<boolean>(url);

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: result.data === true,
  };
}

/**
 * Get the current reward cycle.
 *
 * Endpoint: GET /ccd007-citycoin-stacking/get-current-reward-cycle
 *
 * @returns The current reward cycle number
 */
export async function getCurrentRewardCycle(): Promise<RateLimitedFetchResult<number>> {
  const url = `${BASE_URL}/ccd007-citycoin-stacking/get-current-reward-cycle`;

  const result = await rateLimitedFetch<number>(url);

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return {
    ok: true,
    status: result.status,
    data: Number(result.data) || 0,
  };
}

// =============================================================================
// USER REGISTRY (ccd003)
// =============================================================================

/**
 * Get a user's ID from their address.
 *
 * Endpoint: GET /ccd003-user-registry/get-user-id
 * Query params: user
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
  const url = `${BASE_URL}/ccd003-user-registry/get-user-id?user=${address}`;

  const result = await rateLimitedFetch<number>(url);

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

  const userId = result.data;

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
 * Check if a version is a DAO version
 */
export function isDaoVersion(version: string): version is DaoVersion {
  return version === "daoV1" || version === "daoV2";
}
