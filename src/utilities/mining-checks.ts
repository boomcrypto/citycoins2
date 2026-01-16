/**
 * Mining Claim Verification Utilities
 *
 * Provides read-only contract calls to check if a user won a mining block
 * and whether it has already been claimed.
 */

import {
  fetchCallReadOnlyFunction,
  ClarityValue,
  cvToJSON,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
} from "@stacks/transactions";
import { CityName, Version, CITY_CONFIG, CITY_IDS } from "../config/city-config";

const HIRO_API = "https://api.hiro.so";

export interface MiningClaimStatus {
  canClaim: boolean;
  isWinner: boolean;
  isClaimed: boolean;
}

/**
 * Check if a user can claim a mining reward for a specific block.
 * Calls the appropriate read-only function based on contract version.
 */
export async function checkMiningClaimStatus(
  city: CityName,
  version: Version,
  userAddress: string,
  blockHeight: number
): Promise<MiningClaimStatus> {
  const config = CITY_CONFIG[city][version];
  const contractId = config.mining.contractId;
  const [contractAddress, contractName] = contractId.split(".");

  if (version === "legacyV1" || version === "legacyV2") {
    return checkLegacyMiningClaim(contractAddress, contractName, userAddress, blockHeight);
  } else {
    // daoV1 or daoV2
    const cityId = CITY_IDS[city];
    return checkDaoMiningClaim(contractAddress, contractName, cityId, userAddress, blockHeight);
  }
}

/**
 * Legacy contracts (v1, v2): can-claim-mining-reward(user, minerBlockHeight) -> bool
 */
async function checkLegacyMiningClaim(
  contractAddress: string,
  contractName: string,
  userAddress: string,
  blockHeight: number
): Promise<MiningClaimStatus> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "can-claim-mining-reward",
      functionArgs: [standardPrincipalCV(userAddress), uintCV(blockHeight)],
      senderAddress: userAddress,
      network: "mainnet",
    });

    const canClaim = cvToJSON(result as ClarityValue).value as boolean;

    return {
      canClaim,
      isWinner: canClaim, // If can claim, they won
      isClaimed: !canClaim, // If can't claim and they mined, it's either claimed or not won
    };
  } catch (error) {
    console.error(`Error checking legacy mining claim for block ${blockHeight}:`, error);
    throw error;
  }
}

/**
 * DAO contracts: is-block-winner(cityId, user, claimHeight) -> { claimed: bool, winner: bool }?
 */
async function checkDaoMiningClaim(
  contractAddress: string,
  contractName: string,
  cityId: number,
  userAddress: string,
  blockHeight: number
): Promise<MiningClaimStatus> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "is-block-winner",
      functionArgs: [uintCV(cityId), standardPrincipalCV(userAddress), uintCV(blockHeight)],
      senderAddress: userAddress,
      network: "mainnet",
    });

    const json = cvToJSON(result as ClarityValue);

    // Result is (optional { claimed: bool, winner: bool })
    if (json.value === null) {
      // User didn't participate in this block
      return {
        canClaim: false,
        isWinner: false,
        isClaimed: false,
      };
    }

    const { claimed, winner } = json.value.value as { claimed: { value: boolean }; winner: { value: boolean } };
    const isWinner = winner.value;
    const isClaimed = claimed.value;

    return {
      canClaim: isWinner && !isClaimed,
      isWinner,
      isClaimed,
    };
  } catch (error) {
    console.error(`Error checking DAO mining claim for block ${blockHeight}:`, error);
    throw error;
  }
}

/**
 * Batch check multiple blocks with rate limiting.
 * Calls onProgress after each check to update UI.
 */
export async function batchCheckMiningClaims(
  entries: Array<{ city: CityName; version: Version; block: number }>,
  userAddress: string,
  delayMs: number = 500,
  onProgress?: (block: number, status: MiningClaimStatus) => void
): Promise<Map<string, MiningClaimStatus>> {
  const results = new Map<string, MiningClaimStatus>();

  for (let i = 0; i < entries.length; i++) {
    const { city, version, block } = entries[i];
    const key = `${city}-${block}`;

    try {
      const status = await checkMiningClaimStatus(city, version, userAddress, block);
      results.set(key, status);
      onProgress?.(block, status);
    } catch (error) {
      // On error, mark as unknown/needs retry
      results.set(key, {
        canClaim: false,
        isWinner: false,
        isClaimed: false,
      });
    }

    // Rate limiting - wait between calls (except for last one)
    if (i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
