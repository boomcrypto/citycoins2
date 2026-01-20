/**
 * Legacy Stacking Contract Reads
 *
 * Direct contract reads for legacy v1/v2 stacking functions.
 * Replaces calls to api.citycoins.co
 */

import { ClarityType, uintCV, hexToCV, UIntCV } from "@stacks/transactions";
import { CityName, CITY_CONFIG } from "../../config/city-config";
import { callReadOnlyFunction, ContractCallResult } from "../hiro-client";

type LegacyVersion = "legacyV1" | "legacyV2";

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
      return { ok: true, data: Number((cv as UIntCV).value) };
    }

    // Handle optional none (no reward)
    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: 0 };
    }

    // Handle optional some
    if (cv.type === ClarityType.OptionalSome) {
      const inner = cv.value;
      if (inner.type === ClarityType.UInt) {
        return { ok: true, data: Number((inner as UIntCV).value) };
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
