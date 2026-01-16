/**
 * Mining Claim Verification Utilities
 *
 * Provides read-only contract calls to check if a user won a mining block
 * and whether it has already been claimed.
 */

import {
  ClarityValue,
  cvToJSON,
  serializeCV,
  deserializeCV,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import { CityName, Version, CITY_CONFIG, CITY_IDS } from "../config/city-config";

const HIRO_API = "https://api.hiro.so";

export interface MiningClaimStatus {
  canClaim: boolean;
  isWinner: boolean;
  isClaimed: boolean;
}

/**
 * Make a read-only contract call with proper 429 handling.
 * Uses Retry-After header when available, otherwise exponential backoff.
 */
async function callReadOnlyWithRetry(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string,
  maxRetries: number = 3
): Promise<ClarityValue> {
  const url = `${HIRO_API}/v2/contracts/call-read/${contractAddress}/${contractName}`;

  const body = JSON.stringify({
    sender: senderAddress,
    arguments: functionArgs.map((arg) => `0x${serializeCV(arg).toString("hex")}`),
  });

  let lastError: Error | null = null;
  let baseDelay = 1000; // Start with 1 second

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (response.status === 429) {
        // Rate limited - check for Retry-After header
        const retryAfter = response.headers.get("Retry-After");
        let waitTime: number;

        if (retryAfter) {
          // Retry-After can be seconds or HTTP-date
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds)) {
            waitTime = seconds * 1000;
          } else {
            // Try parsing as HTTP-date
            const retryDate = new Date(retryAfter);
            waitTime = Math.max(0, retryDate.getTime() - Date.now());
          }
        } else {
          // No Retry-After, use exponential backoff
          waitTime = baseDelay * Math.pow(2, attempt);
        }

        console.log(`Rate limited on ${functionName}, waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.okay || !data.result) {
        throw new Error(`Contract call failed: ${JSON.stringify(data)}`);
      }

      // Deserialize the result
      const resultHex = data.result.startsWith("0x") ? data.result.slice(2) : data.result;
      return deserializeCV(Buffer.from(resultHex, "hex"));
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`Error on attempt ${attempt + 1}, retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
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
    const result = await callReadOnlyWithRetry(
      contractAddress,
      contractName,
      "can-claim-mining-reward",
      [standardPrincipalCV(userAddress), uintCV(blockHeight)],
      userAddress
    );

    const canClaim = cvToJSON(result).value as boolean;

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
    const result = await callReadOnlyWithRetry(
      contractAddress,
      contractName,
      "is-block-winner",
      [uintCV(cityId), standardPrincipalCV(userAddress), uintCV(blockHeight)],
      userAddress
    );

    const json = cvToJSON(result);

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
