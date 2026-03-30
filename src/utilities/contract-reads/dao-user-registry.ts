/**
 * DAO User Registry Contract Reads
 *
 * Direct contract reads for DAO user registry (ccd003).
 * Replaces calls to protocol.citycoins.co
 */

import {
  ClarityType,
  standardPrincipalCV,
  hexToCV,
  UIntCV,
} from "@stacks/transactions";
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

// DAO user registry contract address (shared across all cities)
const USER_REGISTRY_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
const USER_REGISTRY_NAME = "ccd003-user-registry";

/**
 * Get a user's ID from their address.
 *
 * Contract function: (get-user-id (user principal))
 * Returns: (optional uint)
 *
 * Note: This is the DAO user registry, shared across all cities.
 * User IDs are registered when users first interact with any DAO contract.
 * Returns null if user has never interacted with DAO contracts.
 *
 * @param address - User's Stacks address
 */
export async function getUserId(
  address: string
): Promise<ContractCallResult<number | null>> {
  const result = await callReadOnlyFunction(
    USER_REGISTRY_ADDRESS,
    USER_REGISTRY_NAME,
    "get-user-id",
    [standardPrincipalCV(address)],
    USER_REGISTRY_ADDRESS
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
