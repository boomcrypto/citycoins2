/**
 * DAO Stacking Contract Reads
 *
 * Direct contract reads for DAO stacking functions.
 * Replaces calls to protocol.citycoins.co
 */

import {
  ClarityType,
  uintCV,
  hexToCV,
  TupleCV,
  UIntCV,
} from "@stacks/transactions";
import { CityName, CITY_CONFIG, CITY_IDS } from "../../config/city-config";
import { callReadOnlyFunction, ContractCallResult } from "../hiro-client";

/**
 * Get stacking contract address and name
 * Note: DAO stacking contract is shared across versions (no v2)
 */
function getStackingContract(): { address: string; name: string } {
  const config = CITY_CONFIG.mia.daoV1.stacking;
  return {
    address: config.deployer,
    name: config.contractName,
  };
}

/**
 * Get the stacking reward for a user in a specific cycle.
 *
 * Contract function: (get-stacking-reward (city-id uint) (user-id uint) (cycle uint))
 * Returns: (optional uint)
 *
 * @param city - City name (mia or nyc)
 * @param userId - User's ID from ccd003-user-registry
 * @param cycle - Reward cycle number
 */
export async function getStackingReward(
  city: CityName,
  userId: number,
  cycle: number
): Promise<ContractCallResult<number>> {
  const { address: contractAddress, name: contractName } = getStackingContract();
  const cityId = CITY_IDS[city];

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-stacking-reward",
    [uintCV(cityId), uintCV(userId), uintCV(cycle)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: 0 };
    }

    if (cv.type === ClarityType.OptionalSome) {
      const inner = cv.value;
      if (inner.type === ClarityType.UInt) {
        return { ok: true, data: Number((inner as UIntCV).value) };
      }
    }

    if (cv.type === ClarityType.UInt) {
      return { ok: true, data: Number((cv as UIntCV).value) };
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
 * Stacker info for a cycle
 */
export interface StackerInfo {
  stacked: number;
  claimable: number;
}

/**
 * Get stacker info for a user in a specific cycle.
 *
 * Contract function: (get-stacker (city-id uint) (user-id uint) (cycle uint))
 * Returns: (optional { stacked: uint, claimable: uint })
 *
 * @param city - City name (mia or nyc)
 * @param userId - User's ID from ccd003-user-registry
 * @param cycle - Reward cycle number
 */
export async function getStacker(
  city: CityName,
  userId: number,
  cycle: number
): Promise<ContractCallResult<StackerInfo>> {
  const { address: contractAddress, name: contractName } = getStackingContract();
  const cityId = CITY_IDS[city];

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-stacker",
    [uintCV(cityId), uintCV(userId), uintCV(cycle)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: { stacked: 0, claimable: 0 } };
    }

    if (cv.type === ClarityType.OptionalSome || cv.type === ClarityType.Tuple) {
      const tuple = (cv.type === ClarityType.OptionalSome ? cv.value : cv) as TupleCV;
      const stacked = tuple.value.stacked as UIntCV | undefined;
      const claimable = tuple.value.claimable as UIntCV | undefined;

      return {
        ok: true,
        data: {
          stacked: stacked ? Number(stacked.value) : 0,
          claimable: claimable ? Number(claimable.value) : 0,
        },
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

/**
 * Check if a cycle has been paid out.
 *
 * Contract function: (is-cycle-paid (city-id uint) (cycle uint))
 * Returns: bool
 *
 * @param city - City name (mia or nyc)
 * @param cycle - Reward cycle number
 */
export async function isCyclePaid(
  city: CityName,
  cycle: number
): Promise<ContractCallResult<boolean>> {
  const { address: contractAddress, name: contractName } = getStackingContract();
  const cityId = CITY_IDS[city];

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "is-cycle-paid",
    [uintCV(cityId), uintCV(cycle)],
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

    return { ok: false, error: `Unexpected response type: ${cv.type}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the current reward cycle.
 *
 * Contract function: (get-current-reward-cycle)
 * Returns: uint
 */
export async function getCurrentRewardCycle(): Promise<ContractCallResult<number>> {
  const { address: contractAddress, name: contractName } = getStackingContract();

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-current-reward-cycle",
    [],
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

    return { ok: false, error: `Unexpected response type: ${cv.type}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
