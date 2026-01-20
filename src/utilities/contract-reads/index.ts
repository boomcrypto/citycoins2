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

export { getStackingReward as legacyGetStackingReward } from "./legacy-stacking";

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
