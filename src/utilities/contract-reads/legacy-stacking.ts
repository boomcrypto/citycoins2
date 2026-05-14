/**
 * Legacy Stacking Contract Reads
 *
 * Direct contract reads for legacy v1/v2 stacking functions.
 * Replaces calls to api.citycoins.co
 */

import { ClarityType, uintCV, hexToCV, TupleCV, UIntCV } from "@stacks/transactions";
import { CityName, CITY_CONFIG } from "../../config/city-config";
import { callReadOnlyFunction, ContractCallResult } from "../hiro-client";

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Safely convert BigInt to Number, returning error if value exceeds safe integer range
 */
function safeNumberFromBigInt(
  value: bigint,
  fieldName: string
): { ok: true; data: number } | { ok: false; error: string } {
  if (value > MAX_SAFE_BIGINT) {
    return {
      ok: false,
      error: `${fieldName} exceeds JavaScript safe integer range`,
    };
  }
  return { ok: true, data: Number(value) };
}

type LegacyVersion = "legacyV1" | "legacyV2";

export interface LegacyStackerInfo {
  amountStacked: number;
  toReturn: number;
}

/**
 * Get contract address and name for legacy stacking
 */
function getStackingContract(
  city: CityName,
  version: LegacyVersion
): { address: string; name: string } {
  const config = CITY_CONFIG[city][version].stacking;
  return {
    address: config.deployer,
    name: config.contractName,
  };
}

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * Contract function: (get-stacking-reward (user-id uint) (cycle uint))
 * Returns: uint
 *
 * Note: Requires userId, not address.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param userId - User's ID in the contract
 * @param cycle - Reward cycle number
 */
export async function getStackingReward(
  city: CityName,
  version: LegacyVersion,
  userId: number,
  cycle: number
): Promise<ContractCallResult<number>> {
  const { address: contractAddress, name: contractName } = getStackingContract(
    city,
    version
  );

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-stacking-reward",
    [uintCV(userId), uintCV(cycle)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    if (cv.type === ClarityType.UInt) {
      const conversion = safeNumberFromBigInt(
        (cv as UIntCV).value,
        "Stacking reward"
      );
      if (!conversion.ok) return conversion;
      return { ok: true, data: conversion.data };
    }

    // Handle optional none (no reward)
    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: 0 };
    }

    // Handle optional some
    if (cv.type === ClarityType.OptionalSome) {
      const inner = cv.value;
      if (inner.type === ClarityType.UInt) {
        const conversion = safeNumberFromBigInt(
          (inner as UIntCV).value,
          "Stacking reward"
        );
        if (!conversion.ok) return conversion;
        return { ok: true, data: conversion.data };
      }
    }

    return { ok: false, error: `Unexpected response type: ${cv.type}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get stacker info for a user in a specific legacy cycle.
 *
 * Contract function: (get-stacker-at-cycle-or-default (rewardCycle uint) (userId uint))
 * Returns: { amountStacked: uint, toReturn: uint }
 *
 * `toReturn` is the stacked CityCoins principal returned when claiming the final
 * cycle of a lock period.
 */
export async function getStackerAtCycle(
  city: CityName,
  version: LegacyVersion,
  userId: number,
  cycle: number
): Promise<ContractCallResult<LegacyStackerInfo>> {
  const { address: contractAddress, name: contractName } = getStackingContract(
    city,
    version
  );

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-stacker-at-cycle-or-default",
    [uintCV(cycle), uintCV(userId)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    if (cv.type !== ClarityType.Tuple) {
      return { ok: false, error: `Unexpected response type: ${cv.type}` };
    }

    const tuple = cv as TupleCV;
    const amountStacked = tuple.value.amountStacked as UIntCV | undefined;
    const toReturn = tuple.value.toReturn as UIntCV | undefined;

    const amountStackedConversion = safeNumberFromBigInt(
      amountStacked?.value ?? 0n,
      "Amount stacked"
    );
    if (!amountStackedConversion.ok) return amountStackedConversion;

    const toReturnConversion = safeNumberFromBigInt(
      toReturn?.value ?? 0n,
      "Amount to return"
    );
    if (!toReturnConversion.ok) return toReturnConversion;

    return {
      ok: true,
      data: {
        amountStacked: amountStackedConversion.data,
        toReturn: toReturnConversion.data,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
