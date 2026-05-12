import {
  Cl,
  ClarityType,
  Pc,
  hexToCV,
  type ClarityValue,
  type PostCondition,
} from "@stacks/transactions";
import { CITY_CLAIMS_CONFIG } from "../../config/city-claims-config";
import { decodeClarityValues, safeConvertToBigint } from "../clarity";
import { callReadOnlyFunction, type ContractCallResult } from "../hiro-client";

const MIA_CONFIG = CITY_CLAIMS_CONFIG.mia;
const [CCD013_ADDRESS, CCD013_NAME] = MIA_CONFIG.redemptionContract.split(".");
const [MIA_V1_ADDRESS, MIA_V1_NAME] = MIA_CONFIG.v1Contract.split(".");
const [MIA_V2_ADDRESS, MIA_V2_NAME] = MIA_CONFIG.v2Contract.split(".");

export const CCD013_REDEMPTION_CONTRACT = MIA_CONFIG.redemptionContract;
export const MIA_REWARDS_TREASURY =
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-rewards-v3";
export const MAX_MIA_REDEMPTION_PER_TX_UMIA = 10_000_000n * 1_000_000n;

export interface Ccd013RedemptionInfo {
  redemptionEnabled: boolean;
  blockHeight: bigint;
  totalSupply: bigint;
  miningTreasuryUstx: bigint;
  currentContractBalance: bigint;
  redemptionRatio: bigint;
  totalRedeemed: bigint;
  totalTransferred: bigint;
}

export interface Ccd013UserRedemptionInfo {
  address: string;
  balanceV1Mia: bigint;
  balanceV2Umia: bigint;
  totalBalanceUmia: bigint;
  redemptionAmountUstx: bigint;
  burnAmountUmia: bigint;
  burnAmountV1Mia: bigint;
  burnAmountV2Umia: bigint;
  claimedUmia: bigint;
  claimedUstx: bigint;
}

export interface MiaRedeemPostConditionInputs {
  userAddress: string;
  burnAmountV1Mia: bigint;
  burnAmountV2Umia: bigint;
  redemptionAmountUstx: bigint;
}

function parseContractResult<T>(
  hex: string,
  mapper: (decoded: any) => T
): ContractCallResult<T> {
  try {
    const cv = hexToCV(hex);
    if (cv.type === ClarityType.ResponseErr) {
      return { ok: false, error: "Contract read returned an error response" };
    }
    return { ok: true, data: mapper(decodeClarityValues(cv, false)) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function mapCcd013RedemptionInfo(raw: any): Ccd013RedemptionInfo {
  return {
    redemptionEnabled: Boolean(raw["redemption-enabled"]),
    blockHeight: safeConvertToBigint(raw["block-height"]),
    totalSupply: safeConvertToBigint(raw["total-supply"]),
    miningTreasuryUstx: safeConvertToBigint(raw["mining-treasury-ustx"]),
    currentContractBalance: safeConvertToBigint(raw["current-contract-balance"]),
    redemptionRatio: safeConvertToBigint(raw["redemption-ratio"]),
    totalRedeemed: safeConvertToBigint(raw["total-redeemed"]),
    totalTransferred: safeConvertToBigint(raw["total-transferred"]),
  };
}

export function mapCcd013UserRedemptionInfo(raw: any): Ccd013UserRedemptionInfo {
  const balances = raw["mia-balances"] ?? {};
  const claims = raw["redemption-claims"] ?? {};

  return {
    address: String(raw.address ?? ""),
    balanceV1Mia: safeConvertToBigint(balances["balance-v1-mia"] ?? 0n),
    balanceV2Umia: safeConvertToBigint(balances["balance-v2-umia"] ?? 0n),
    totalBalanceUmia: safeConvertToBigint(balances["total-balance-umia"] ?? 0n),
    redemptionAmountUstx: safeConvertToBigint(raw["redemption-amount-ustx"] ?? 0n),
    burnAmountUmia: safeConvertToBigint(raw["burn-amount-umia"] ?? 0n),
    burnAmountV1Mia: safeConvertToBigint(raw["burn-amount-v1-mia"] ?? 0n),
    burnAmountV2Umia: safeConvertToBigint(raw["burn-amount-v2-umia"] ?? 0n),
    claimedUmia: safeConvertToBigint(claims.umia ?? 0n),
    claimedUstx: safeConvertToBigint(claims.ustx ?? 0n),
  };
}

export async function getCcd013RedemptionInfo(
  senderAddress = CCD013_ADDRESS
): Promise<ContractCallResult<Ccd013RedemptionInfo>> {
  const result = await callReadOnlyFunction(
    CCD013_ADDRESS,
    CCD013_NAME,
    "get-redemption-info",
    [],
    senderAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No redemption info returned" };
  }

  return parseContractResult(result.data, mapCcd013RedemptionInfo);
}

export async function getCcd013UserRedemptionInfo(
  userAddress: string,
  amountUmia?: bigint
): Promise<ContractCallResult<Ccd013UserRedemptionInfo>> {
  const amountArg: ClarityValue =
    amountUmia === undefined ? Cl.none() : Cl.some(Cl.uint(amountUmia));
  const result = await callReadOnlyFunction(
    CCD013_ADDRESS,
    CCD013_NAME,
    "get-user-redemption-info",
    [Cl.principal(userAddress), amountArg],
    userAddress
  );

  if (!result.ok || !result.data) {
    return { ok: false, error: result.error || "No user redemption info returned" };
  }

  return parseContractResult(result.data, mapCcd013UserRedemptionInfo);
}

export function buildMiaRedeemPostConditions(
  inputs: MiaRedeemPostConditionInputs
): PostCondition[] {
  const postConditions: PostCondition[] = [];

  if (inputs.burnAmountV1Mia > 0n) {
    postConditions.push(
      Pc.principal(inputs.userAddress)
        .willSendLte(inputs.burnAmountV1Mia)
        .ft(`${MIA_V1_ADDRESS}.${MIA_V1_NAME}`, MIA_CONFIG.assetId)
    );
  }

  if (inputs.burnAmountV2Umia > 0n) {
    postConditions.push(
      Pc.principal(inputs.userAddress)
        .willSendLte(inputs.burnAmountV2Umia)
        .ft(`${MIA_V2_ADDRESS}.${MIA_V2_NAME}`, MIA_CONFIG.assetId)
    );
  }

  postConditions.push(
    Pc.principal(MIA_REWARDS_TREASURY)
      .willSendGte(inputs.redemptionAmountUstx)
      .ustx()
  );

  return postConditions;
}
