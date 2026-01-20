/**
 * DAO Mining Contract Reads
 *
 * Direct contract reads for DAO v1/v2 mining functions.
 * Replaces calls to protocol.citycoins.co
 */

import {
  ClarityType,
  standardPrincipalCV,
  uintCV,
  hexToCV,
  TupleCV,
  UIntCV,
} from "@stacks/transactions";
import { CityName, CITY_CONFIG, CITY_IDS } from "../../config/city-config";
import { callReadOnlyFunction, ContractCallResult } from "../hiro-client";

type DaoVersion = "daoV1" | "daoV2";

/**
 * Get contract address and name for DAO mining
 */
function getMiningContract(version: DaoVersion): { address: string; name: string } {
  // DAO mining contracts are shared across cities
  const config = CITY_CONFIG.mia[version].mining;
  return {
    address: config.deployer,
    name: config.contractName,
  };
}

/**
 * Block winner result with claim status
 */
export interface BlockWinnerResult {
  isWinner: boolean;
  isClaimed: boolean;
}

/**
 * Check if a user is the block winner and if they've claimed.
 *
 * Contract function: (is-block-winner (city-id uint) (user principal) (claim-height uint))
 * Returns: (optional { claimed: bool, winner: bool })
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (daoV1 or daoV2)
 * @param userAddress - User's Stacks address
 * @param claimHeight - The block height to check
 */
export async function isBlockWinner(
  city: CityName,
  version: DaoVersion,
  userAddress: string,
  claimHeight: number
): Promise<ContractCallResult<BlockWinnerResult>> {
  const { address: contractAddress, name: contractName } = getMiningContract(version);
  const cityId = CITY_IDS[city];

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "is-block-winner",
    [uintCV(cityId), standardPrincipalCV(userAddress), uintCV(claimHeight)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    // Returns (optional { claimed: bool, winner: bool })
    if (cv.type === ClarityType.OptionalNone) {
      // User didn't participate in this block
      return { ok: true, data: { isWinner: false, isClaimed: false } };
    }

    if (cv.type === ClarityType.OptionalSome) {
      const tuple = cv.value as TupleCV;
      const winner = tuple.value.winner;
      const claimed = tuple.value.claimed;

      return {
        ok: true,
        data: {
          isWinner: winner?.type === ClarityType.BoolTrue,
          isClaimed: claimed?.type === ClarityType.BoolTrue,
        },
      };
    }

    // Direct tuple (shouldn't happen but handle it)
    if (cv.type === ClarityType.Tuple) {
      const tuple = cv as TupleCV;
      const winner = tuple.value.winner;
      const claimed = tuple.value.claimed;

      return {
        ok: true,
        data: {
          isWinner: winner?.type === ClarityType.BoolTrue,
          isClaimed: claimed?.type === ClarityType.BoolTrue,
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
 * Mining stats for a block
 */
export interface MiningStats {
  miners: number;
  amount: number;
  claimed: boolean;
}

/**
 * Get mining statistics for a block.
 *
 * Contract function: (get-mining-stats-at-block (city-id uint) (block-height uint))
 * Returns: (optional { amount: uint, claimed: bool, miners: uint })
 *
 * @param city - City name (mia or nyc)
 * @param version - Contract version (daoV1 or daoV2)
 * @param height - The block height
 */
export async function getMiningStats(
  city: CityName,
  version: DaoVersion,
  height: number
): Promise<ContractCallResult<MiningStats>> {
  const { address: contractAddress, name: contractName } = getMiningContract(version);
  const cityId = CITY_IDS[city];

  const result = await callReadOnlyFunction(
    contractAddress,
    contractName,
    "get-mining-stats-at-block",
    [uintCV(cityId), uintCV(height)],
    contractAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No result" };
  }

  try {
    const cv = hexToCV(result.data);

    // Returns (optional { amount: uint, claimed: bool, miners: uint })
    if (cv.type === ClarityType.OptionalNone) {
      return { ok: true, data: { miners: 0, amount: 0, claimed: false } };
    }

    if (cv.type === ClarityType.OptionalSome || cv.type === ClarityType.Tuple) {
      const tuple = (cv.type === ClarityType.OptionalSome ? cv.value : cv) as TupleCV;
      const miners = tuple.value.miners as UIntCV | undefined;
      const amount = tuple.value.amount as UIntCV | undefined;
      const claimed = tuple.value.claimed;

      return {
        ok: true,
        data: {
          miners: miners ? Number(miners.value) : 0,
          amount: amount ? Number(amount.value) : 0,
          claimed: claimed?.type === ClarityType.BoolTrue,
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
