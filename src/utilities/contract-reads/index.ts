/**
 * Contract Reads Module
 *
 * Re-exports all contract read functions for direct Stacks contract access.
 * These replace the CityCoins API middleware calls.
 */

// Legacy v1/v2 contract reads
export {
  canClaimMiningReward as legacyCanClaimMiningReward,
  isBlockWinner as legacyIsBlockWinner,
} from "./legacy-mining";

export {
  getStackingReward as legacyGetStackingReward,
  getStackerAtCycle as legacyGetStackerAtCycle,
  type LegacyStackerInfo,
} from "./legacy-stacking";

export { getUserId as legacyGetUserId } from "./legacy-user-registry";

// DAO v1/v2 contract reads
export {
  isBlockWinner as daoIsBlockWinner,
  getMiningStats as daoGetMiningStats,
  type BlockWinnerResult,
  type MiningStats,
} from "./dao-mining";

export {
  getStackingReward as daoGetStackingReward,
  getStacker as daoGetStacker,
  isCyclePaid as daoIsCyclePaid,
  getCurrentRewardCycle as daoGetCurrentRewardCycle,
  type StackerInfo,
} from "./dao-stacking";

export { getUserId as daoGetUserId } from "./dao-user-registry";

export {
  getCcd013RedemptionInfo,
  getCcd013UserRedemptionInfo,
  buildMiaRedeemPostConditions,
  mapCcd013RedemptionInfo,
  mapCcd013UserRedemptionInfo,
  CCD013_REDEMPTION_CONTRACT,
  MIA_REWARDS_TREASURY,
  MAX_MIA_REDEMPTION_PER_TX_UMIA,
  type Ccd013RedemptionInfo,
  type Ccd013UserRedemptionInfo,
  type MiaRedeemPostConditionInputs,
} from "./ccd013-redemption";
