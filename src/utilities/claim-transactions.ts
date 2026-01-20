/**
 * Claim Transaction Builders
 *
 * Builds the appropriate contract call parameters for claiming
 * mining and stacking rewards across all CityCoins contract versions.
 */

import { Cl } from "@stacks/transactions";
import { request } from "@stacks/connect";
import {
  CityName,
  Version,
  CITY_CONFIG,
} from "../config/city-config";

export interface ClaimTransactionParams {
  contract: string;
  functionName: string;
  functionArgs: string[]; // Hex-encoded Clarity values
}

/**
 * Build mining claim transaction parameters
 *
 * Legacy contracts (v1, v2): claim-mining-reward(blockHeight)
 * DAO contracts: claim-mining-reward(cityName, blockHeight)
 */
export function buildMiningClaimTx(
  city: CityName,
  version: Version,
  blockHeight: number
): ClaimTransactionParams {
  const config = CITY_CONFIG[city][version];
  const { contractId } = config.mining;
  const isDao = version === "daoV1" || version === "daoV2";

  let functionArgs: string[];

  if (isDao) {
    // DAO: (cityName: (string-utf8 10), claimHeight: uint)
    const cityArg = Cl.stringUtf8(city);
    const blockArg = Cl.uint(blockHeight);
    functionArgs = [Cl.serialize(cityArg), Cl.serialize(blockArg)];
  } else {
    // Legacy: (minerBlockHeight: uint)
    const blockArg = Cl.uint(blockHeight);
    functionArgs = [Cl.serialize(blockArg)];
  }

  return {
    contract: contractId,
    functionName: "claim-mining-reward",
    functionArgs,
  };
}

/**
 * Build stacking claim transaction parameters
 *
 * Legacy contracts (v1, v2): claim-stacking-reward(targetCycle)
 * DAO contracts: claim-stacking-reward(cityName, targetCycle)
 */
export function buildStackingClaimTx(
  city: CityName,
  version: Version,
  cycle: number
): ClaimTransactionParams {
  const config = CITY_CONFIG[city][version];
  // For legacy, stacking claims go to the core contract
  // For DAO, they go to ccd007-citycoin-stacking
  const { contractId } = config.stacking;
  const isDao = version === "daoV1" || version === "daoV2";

  let functionArgs: string[];

  if (isDao) {
    // DAO: (cityName: (string-utf8 10), targetCycle: uint)
    const cityArg = Cl.stringUtf8(city);
    const cycleArg = Cl.uint(cycle);
    functionArgs = [Cl.serialize(cityArg), Cl.serialize(cycleArg)];
  } else {
    // Legacy: (targetCycle: uint)
    const cycleArg = Cl.uint(cycle);
    functionArgs = [Cl.serialize(cycleArg)];
  }

  return {
    contract: contractId,
    functionName: "claim-stacking-reward",
    functionArgs,
  };
}

/**
 * Execute a claim transaction via @stacks/connect
 */
export async function executeClaimTransaction(
  params: ClaimTransactionParams
): Promise<void> {
  const [address, name] = params.contract.split(".");

  await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    postConditionMode: "allow", // Claims don't send tokens, just receive
  });
}
