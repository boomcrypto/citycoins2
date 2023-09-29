import { atomWithStorage } from "jotai/utils";
import { RewardCycle } from "./stacks";
import { CC_API, fetchJson } from "./common";
import { atom } from "jotai";

/////////////////////////
// TYPES
/////////////////////////

type CityKeys = "mia" | "nyc";

type VersionKeys = "legacyV1" | "legacyV2" | "daoV1" | "daoV2";

type CityInfo = {
  name: string;
  displayName: string;
  symbol: string;
  logo: string; // SVG component
  bgLogo: string; // SVG component
  versions: VersionKeys[];
  currentVersion: string;
};

type TokenContract = {
  deployer: string;
  contractName: string;
  activated: boolean;
  activationBlock: number;
  displayName: string;
  tokenName: string;
  symbol: string;
  decimals: number;
  logo: string; // URL
  uri: string; // URL
};

type MiningContract = {
  deployer: string;
  contractName: string;
  miningFunction: string;
  miningClaimFunction: string;
  activated: true;
  activationBlock?: number;
  shutdown: boolean;
  shutdownBlock?: number;
};

type StackingContract = {
  deployer: string;
  contractName: string;
  stackingFunction: string;
  stackingClaimFunction: string;
  startCycle: number;
  endCycle?: number;
};

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const citycoinsRewardCycleAtom = atomWithStorage<RewardCycle | null>(
  "citycoins-cc-ccRewardCycle",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

/////////////////////////
// FETCH ATOMS
/////////////////////////

export const fetchCitycoinsRewardCycleAtom = atom(
  (get) => get(citycoinsRewardCycleAtom),
  async (_, set) => {
    try {
      const rewardCycleUrl = new URL(
        "ccd007-citycoin-stacking/get-current-reward-cycle",
        CC_API
      );
      const rewardCycle = await fetchJson<number>(rewardCycleUrl.toString());
      const firstBlockUrl = new URL(
        "ccd007-citycoin-stacking/get-first-block-in-reward-cycle",
        CC_API
      );
      firstBlockUrl.searchParams.set("cycle", rewardCycle.toString());
      const firstBlockInRewardCycle = await fetchJson<number>(
        firstBlockUrl.toString()
      );
      const rewardCycleInfo: RewardCycle = {
        currentCycle: rewardCycle,
        startBlock: firstBlockInRewardCycle,
        endBlock: firstBlockInRewardCycle + 2100 - 1,
      };
      set(citycoinsRewardCycleAtom, rewardCycleInfo);
    } catch (error) {
      throw error;
    }
  }
);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

function test() {
  // todo
  return undefined;
}

export default test;
