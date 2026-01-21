/**
 * Legacy Mining Contract Reads
 *
 * Direct contract reads for legacy v1/v2 mining functions.
 * Replaces calls to api.citycoins.co
 */

import {
  ClarityType,
  standardPrincipalCV,
  uintCV,
  hexToCV,
} from "@stacks/transactions";
import { CityName, CITY_CONFIG } from "../../config/city-config";
import { callReadOnlyFunction, ContractCallResult } from "../hiro-client";

type LegacyVersion = "legacyV1" | "legacyV2";

/**
 * Get contract address and name for legacy mining
 */
function getMiningContract(
  city: CityName,
  version: LegacyVersion
): { address: string; name: string } {
  const config = CITY_CONFIG[city][version].mining;
  return {
    address: config.deployer,
    name: config.contractName,
  };
}

/**
 * Check if a user can claim a mining reward for a specific block.
 *
 * Contract function: (can-claim-mining-reward (user principal) (block-height uint))
 * Returns: (ok bool) or (err uint)
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param blockHeight - The block height to check
 * @param address - User's Stacks address
 */
export async function canClaimMiningReward(
  city: CityName,
  version: LegacyVersion,
  blockHeight: number,
  address: string
): Promise<ContractCallResult<boolean>> {
  const { address: contractAddress, name: contractName } = getMiningContract(
    city,
    version
  );

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "can-claim-mining-reward",
    [standardPrincipalCV(address), uintCV(blockHeight)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    // Response is (ok bool) or (err uint)
    if (cv.type === ClarityType.ResponseOk) {
      const inner = cv.value;
      return {
        ok: true,
        data: inner.type === ClarityType.BoolTrue,
      };
    }

    // If response is an error, they can't claim
    if (cv.type === ClarityType.ResponseErr) {
      return { ok: true, data: false };
    }

    // Direct bool (shouldn't happen but handle it)
    if (cv.type === ClarityType.BoolTrue || cv.type === ClarityType.BoolFalse) {
      return { ok: true, data: cv.type === ClarityType.BoolTrue };
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
 * Check if a user is the block winner for a specific block.
 *
 * Contract function: (is-block-winner (user principal) (block-height uint))
 * Returns: bool
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (legacyV1 or legacyV2)
 * @param blockHeight - The block height to check
 * @param address - User's Stacks address
 */
export async function isBlockWinner(
  city: CityName,
  version: LegacyVersion,
  blockHeight: number,
  address: string
): Promise<ContractCallResult<boolean>> {
  const { address: contractAddress, name: contractName } = getMiningContract(
    city,
    version
  );

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "is-block-winner",
    [standardPrincipalCV(address), uintCV(blockHeight)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    if (cv.type === ClarityType.BoolTrue) {
      return { ok: true, data: true };
    }

    if (cv.type === ClarityType.BoolFalse) {
      return { ok: true, data: false };
    }

    // Handle wrapped response
    if (cv.type === ClarityType.ResponseOk) {
      const inner = cv.value;
      return {
        ok: true,
        data: inner.type === ClarityType.BoolTrue,
      };
    }

    return { ok: false, error: `Unexpected response type: ${cv.type}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
