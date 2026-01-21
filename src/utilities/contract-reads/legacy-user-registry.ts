/**
 * Legacy User Registry Contract Reads
 *
 * Direct contract reads for legacy v1/v2 user registry functions.
 * Replaces calls to api.citycoins.co
 */

import {
  ClarityType,
  standardPrincipalCV,
  hexToCV,
  UIntCV,
} from "@stacks/transactions";
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

/**
 * Get contract address and name for legacy core (user registry is part of core)
 */
function getCoreContract(
  city: CityName,
  version: LegacyVersion
): { address: string; name: string } {
  // In legacy contracts, user registry is part of the core contract
  const config = CITY_CONFIG[city][version].mining;
  return {
    address: config.deployer,
    name: config.contractName,
  };
}

/**
 * Get a user's ID from their address.
 *
 * Contract function: (get-user-id (user principal))
 * Returns: (optional uint)
 *
 * Note: User IDs are registered when users first interact with the contract.
 * Returns null if user has never interacted with the contract.
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param address - User's Stacks address
 */
export async function getUserId(
  city: CityName,
  version: LegacyVersion,
  address: string
): Promise<ContractCallResult<number | null>> {
  const { address: contractAddress, name: contractName } = getCoreContract(
    city,
    version
  );

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-user-id",
    [standardPrincipalCV(address)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    // Returns (optional uint)
    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: null };
    }

    if (cv.type === ClarityType.OptionalSome) {
      const inner = cv.value;
      if (inner.type === ClarityType.UInt) {
        const conversion = safeNumberFromBigInt(
          (inner as UIntCV).value,
          "User ID"
        );
        if (!conversion.ok) return conversion;
        return { ok: true, data: conversion.data };
      }
    }

    // Direct uint (shouldn't happen but handle it)
    if (cv.type === ClarityType.UInt) {
      const conversion = safeNumberFromBigInt((cv as UIntCV).value, "User ID");
      if (!conversion.ok) return conversion;
      return { ok: true, data: conversion.data };
    }

    return { ok: false, error: `Unexpected response type: ${cv.type}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
