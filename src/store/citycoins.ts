import { atomWithStorage } from "jotai/utils";
import { RewardCycle, accountBalancesAtom, stxAddressAtom } from "./stacks";
import { CC_API, CC_API_LEGACY, fetchJson, formatMicroAmount } from "./common";
import { atom } from "jotai";

/////////////////////////
// TYPES
/////////////////////////

export type CityKeys = "mia" | "nyc";

type VersionKeys = (typeof VERSIONS)[number];

// TODO figure out how this fits in with other types
type UserIds = {
  mia: {
    legacyV1: number | null;
    legacyV2: number | null;
  };
  nyc: {
    legacyV1: number | null;
    legacyV2: number | null;
  };
  ccd003: number | null;
};

type CityInfo = {
  name: string;
  displayName: string;
  symbol: string;
  // logo: string; // SVG component
  // bgLogo: string; // SVG component
  versions: readonly VersionKeys[];
  currentVersion: VersionKeys;
};

type CompiledCityInfo = {
  [key in CityKeys]: CityInfo;
};

type BaseContract = {
  deployer: string;
  contractName: string;
  activated: boolean;
  activationBlock?: number;
};

type TokenContract = BaseContract & {
  displayName: string;
  tokenName: string;
  symbol: string;
  decimals: number;
  logo: string; // URL
  uri: string; // URL
};

type MiningContract = BaseContract & {
  miningFunction: string;
  miningClaimFunction: string;
  shutdown: boolean;
  shutdownBlock?: number;
};

type StackingContract = BaseContract & {
  stackingFunction: string;
  stackingClaimFunction: string;
  stackingTreasuryContract: string;
  startCycle: number;
  endCycle?: number;
};

type AnyContract = TokenContract | MiningContract | StackingContract;

type CityConfig = {
  mining: MiningContract;
  stacking: StackingContract;
  token: TokenContract;
};

type CityConfigFunction = (city: CityKeys) => CityConfig;

type CityConfigByVersion = {
  [key in VersionKeys]: CityConfig;
};

type CompiledCityConfig = {
  [key in CityKeys]: CityConfigByVersion;
};

/////////////////////////
// CONSTANTS
/////////////////////////

// VERSIONS

const VERSIONS = ["legacyV1", "legacyV2", "daoV1", "daoV2"] as const;
const CURRENT_VERSION = VERSIONS[VERSIONS.length - 1];

// CITY INFO

const MIA_INFO: CityInfo = {
  name: "mia",
  displayName: "Miami",
  symbol: "MIA",
  // logo: MiamiCoin,
  // bgLogo: MiamiCoinBG,
  versions: VERSIONS,
  currentVersion: CURRENT_VERSION,
};

const NYC_INFO: CityInfo = {
  name: "nyc",
  displayName: "New York City",
  symbol: "NYC",
  // logo: NewYorkCityCoin,
  // bgLogo: NewYorkCityCoinBG,
  versions: VERSIONS,
  currentVersion: CURRENT_VERSION,
};

export const CITY_INFO: CompiledCityInfo = {
  mia: MIA_INFO,
  nyc: NYC_INFO,
};

// TOKEN CONFIG

const MIA_TOKEN_V1: TokenContract = {
  deployer: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
  contractName: "miamicoin-token",
  activated: true,
  activationBlock: 24497,
  displayName: "MiamiCoin",
  tokenName: "miamicoin",
  symbol: "MIA",
  decimals: 0,
  logo: "https://cdn.citycoins.co/logos/miamicoin.png",
  uri: "https://cdn.citycoins.co/metadata/miamicoin.json",
};

const MIA_TOKEN_V2: TokenContract = {
  deployer: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R",
  contractName: "miamicoin-token-v2",
  activated: true,
  activationBlock: 24497,
  displayName: "MiamiCoin",
  tokenName: "miamicoin",
  symbol: "MIA",
  decimals: 6,
  logo: "https://cdn.citycoins.co/logos/miamicoin.png",
  uri: "https://cdn.citycoins.co/metadata/miamicoin.json",
};

const NYC_TOKEN_V1: TokenContract = {
  deployer: "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5",
  contractName: "newyorkcitycoin-token",
  activated: true,
  activationBlock: 37449,
  displayName: "NewYorkCityCoin",
  tokenName: "newyorkcitycoin",
  symbol: "NYC",
  decimals: 0,
  logo: "https://cdn.citycoins.co/logos/newyorkcitycoin.png",
  uri: "https://cdn.citycoins.co/metadata/newyorkcitycoin.json",
};

const NYC_TOKEN_V2: TokenContract = {
  deployer: "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11",
  contractName: "newyorkcitycoin-token-v2",
  activated: true,
  activationBlock: 37449,
  displayName: "NewYorkCityCoin",
  tokenName: "newyorkcitycoin",
  symbol: "NYC",
  decimals: 6,
  logo: "https://cdn.citycoins.co/logos/newyorkcitycoin.png",
  uri: "https://cdn.citycoins.co/metadata/newyorkcitycoin.json",
};

const CITYCOIN_TOKENS = [
  MIA_TOKEN_V1,
  MIA_TOKEN_V2,
  NYC_TOKEN_V1,
  NYC_TOKEN_V2,
];

// DAO CONFIG

const DAO_V2: CityConfigFunction = (city: CityKeys) => {
  const tokenConfig = (city: CityKeys) => {
    switch (city) {
      case "mia":
        return MIA_TOKEN_V2;
      case "nyc":
        return NYC_TOKEN_V2;
    }
  };
  const treasuryContract = (city: CityKeys) => {
    switch (city) {
      case "mia":
        return "ccd002-treasury-mia-stacking";
      case "nyc":
        return "ccd002-treasury-nyc-stacking";
    }
  };
  return {
    mining: {
      deployer: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH",
      contractName: "ccd006-citycoin-mining-v2",
      miningFunction: "mine",
      miningClaimFunction: "claim-mining-reward",
      activated: true,
      activationBlock: 107389,
      shutdown: false,
      shutdownBlock: undefined,
    },
    stacking: {
      deployer: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH",
      contractName: "ccd007-citycoin-stacking",
      stackingFunction: "stack",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: treasuryContract(city),
      activated: true,
      startCycle: 54,
      endCycle: undefined,
    },
    token: tokenConfig(city),
  };
};

const DAO_V1: CityConfigFunction = (city: CityKeys) => {
  const tokenConfig = (city: CityKeys) => {
    switch (city) {
      case "mia":
        return MIA_TOKEN_V2;
      case "nyc":
        return NYC_TOKEN_V2;
    }
  };
  const treasuryContract = (city: CityKeys) => {
    switch (city) {
      case "mia":
        return "ccd002-treasury-mia-stacking";
      case "nyc":
        return "ccd002-treasury-nyc-stacking";
    }
  };
  return {
    mining: {
      deployer: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH",
      contractName: "ccd006-citycoin-mining",
      miningFunction: "mine",
      miningClaimFunction: "claim-mining-reward",
      activated: true,
      activationBlock: 96779,
      shutdown: true,
      shutdownBlock: 107389,
    },
    stacking: {
      deployer: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH",
      contractName: "ccd007-citycoin-stacking",
      stackingFunction: "stack",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: treasuryContract(city),
      activated: true,
      startCycle: 54,
      endCycle: undefined,
    },
    token: tokenConfig(city),
  };
};

// CITY CONFIG

export const MIA_CONFIG: CityConfigByVersion = {
  legacyV1: {
    mining: {
      deployer: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      contractName: "miamicoin-core-v1",
      miningFunction: "mine-many",
      miningClaimFunction: "claim-mining-reward",
      activated: false,
      activationBlock: 24497,
      shutdown: true,
      shutdownBlock: 58917,
    },
    stacking: {
      deployer: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      contractName: "miamicoin-core-v1",
      stackingFunction: "stack-tokens",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: "miamicoin-core-v1",
      activated: true,
      startCycle: 1,
      endCycle: 16,
    },
    token: MIA_TOKEN_V1,
  },
  legacyV2: {
    mining: {
      deployer: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R",
      contractName: "miamicoin-core-v2",
      miningFunction: "mine-many",
      miningClaimFunction: "claim-mining-reward",
      activated: true,
      activationBlock: 58921,
      shutdown: true,
      shutdownBlock: 96779,
    },
    stacking: {
      deployer: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R",
      contractName: "miamicoin-core-v2",
      stackingFunction: "stack-tokens",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: "miamicoin-core-v2",
      activated: true,
      startCycle: 17,
      endCycle: 34,
    },
    token: MIA_TOKEN_V2,
  },
  daoV1: DAO_V1("mia"),
  daoV2: DAO_V2("mia"),
};

export const NYC_CONFIG: CityConfigByVersion = {
  legacyV1: {
    mining: {
      deployer: "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5",
      contractName: "newyorkcitycoin-core-v1",
      miningFunction: "mine-many",
      miningClaimFunction: "claim-mining-reward",
      activated: true,
      activationBlock: 37449,
      shutdown: true,
      shutdownBlock: 58922,
    },
    stacking: {
      deployer: "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5",
      contractName: "newyorkcitycoin-core-v1",
      stackingFunction: "stack-tokens",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: "newyorkcitycoin-core-v1",
      activated: true,
      startCycle: 1,
      endCycle: 10,
    },
    token: NYC_TOKEN_V1,
  },
  legacyV2: {
    mining: {
      deployer: "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11",
      contractName: "newyorkcitycoin-core-v2",
      miningFunction: "mine-many",
      miningClaimFunction: "claim-mining-reward",
      activated: true,
      activationBlock: 58925,
      shutdown: true,
      shutdownBlock: 96779,
    },
    stacking: {
      deployer: "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11",
      contractName: "newyorkcitycoin-core-v2",
      stackingFunction: "stack-tokens",
      stackingClaimFunction: "claim-stacking-reward",
      stackingTreasuryContract: "newyorkcitycoin-core-v2",
      activated: true,
      startCycle: 11,
      endCycle: 28,
    },
    token: NYC_TOKEN_V2,
  },
  daoV1: DAO_V1("nyc"),
  daoV2: DAO_V2("nyc"),
};

const CITY_CONFIG: CompiledCityConfig = {
  mia: MIA_CONFIG,
  nyc: NYC_CONFIG,
};

// key: SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token::miamicoin
// key: SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2::newyorkcitycoin
// key: SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2::miamicoin
// key: SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token::newyorkcitycoin

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const citycoinsRewardCycleAtom = atomWithStorage<RewardCycle | null>(
  "citycoins-cc-RewardCycle",
  null
);

export const citycoinsSelectedCityAtom = atomWithStorage<CityKeys | null>(
  "citycoins-cc-selectedCity",
  null
);

export const citycoinsUserIdsAtom = atomWithStorage<UserIds | null>(
  "citycoins-cc-userIds",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const validTokensAtom = atom(() => {
  return CITYCOIN_TOKENS.map(
    (token: TokenContract) =>
      `${token.deployer}.${token.contractName}::${token.tokenName}`
  );
});

export const displayCitycoinBalancesAtom = atom((get) => {
  const accountBalances = get(accountBalancesAtom);
  const validTokens = get(validTokensAtom);
  const formattedBalances: Record<string, string> = {};

  if (!accountBalances || !accountBalances.fungible_tokens) return null;

  validTokens.forEach((tokenIdentifier) => {
    const [contractName, tokenName] = tokenIdentifier.split("::");
    const cityKey = mapTokenToCityKey(tokenName);
    if (cityKey) {
      const balanceInfo = accountBalances.fungible_tokens[tokenIdentifier];
      const version = contractName.includes("-v2") ? "-v2" : "";
      const finalKey = `${cityKey}${version}`;
      formattedBalances[finalKey] = balanceInfo
        ? formatMicroAmount(Number(balanceInfo.balance))
        : "0";
    }
  });
  return formattedBalances;
});

export const currentCityConfigAtom = atom((get) => {
  const selectedCity = get(citycoinsSelectedCityAtom);
  if (!selectedCity) return null;
  return CITY_CONFIG[selectedCity];
});

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

export const fetchCitycoinsUserIdsAtom = atom(
  (get) => get(citycoinsUserIdsAtom),
  async (get, set) => {
    const stxAddress = get(stxAddressAtom);
    if (!stxAddress) {
      set(citycoinsUserIdsAtom, null);
      return;
    }
    try {
      const userIds = await getUserIds(stxAddress);
      set(citycoinsUserIdsAtom, userIds);
    } catch (error) {
      throw error;
    }
  }
);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// city = currentCity.data
// block = block height for mining claim
export async function getVersionByBlock(city: CityKeys, block: number) {
  for (const version of CITY_INFO[city].versions) {
    const activationBlock = CITY_CONFIG[city][version].mining.activationBlock;
    const shutdown = CITY_CONFIG[city][version].mining.shutdown;
    const shutdownBlock = shutdown
      ? CITY_CONFIG[city][version].mining.shutdownBlock
      : undefined;
    if (activationBlock && block < activationBlock) {
      return undefined;
    }
    if (shutdownBlock && block <= shutdownBlock) {
      return version;
    }
    if (!shutdown) {
      return version;
    }
  }
}

// city = currentCity.data
// cycle = stacking cycle for stacking claim
export function getVersionByCycle(city: CityKeys, cycle: number) {
  for (const version of CITY_INFO[city].versions) {
    const startCycle = CITY_CONFIG[city][version].stacking.startCycle;
    const endCycle = CITY_CONFIG[city][version].stacking.endCycle;
    if (cycle < startCycle) {
      return undefined;
    }
    if (cycle >= startCycle && endCycle === undefined) {
      return version;
    }
    if (endCycle && cycle <= endCycle) {
      return version;
    }
  }
}

function mapTokenToCityKey(tokenName: string) {
  if (
    tokenName === MIA_TOKEN_V1.tokenName ||
    tokenName === MIA_TOKEN_V2.tokenName
  ) {
    return "mia";
  } else if (
    tokenName === NYC_TOKEN_V1.tokenName ||
    tokenName === NYC_TOKEN_V2.tokenName
  ) {
    return "nyc";
  }
  return null;
}

export async function getUserIds(stxAddress: string): Promise<UserIds> {
  const miaLegacyV1Url = new URL(
    `v1/mia/activation/get-user-id/${stxAddress}`,
    CC_API_LEGACY
  );
  miaLegacyV1Url.searchParams.set("format", "raw");
  const miaLegacyV2Url = new URL(
    `v2/mia/activation/get-user-id/${stxAddress}`,
    CC_API_LEGACY
  );
  miaLegacyV2Url.searchParams.set("format", "raw");
  const nycLegacyV1Url = new URL(
    `v1/nyc/activation/get-user-id/${stxAddress}`,
    CC_API_LEGACY
  );
  nycLegacyV1Url.searchParams.set("format", "raw");
  const nycLegacyV2Url = new URL(
    `v2/nyc/activation/get-user-id/${stxAddress}`,
    CC_API_LEGACY
  );
  nycLegacyV2Url.searchParams.set("format", "raw");
  const ccd003Url = new URL(`ccd003-user-registry/get-user-id`, CC_API);
  ccd003Url.searchParams.set("user", stxAddress);
  const userIdsArray = await Promise.allSettled([
    fetchJson<number>(miaLegacyV1Url.toString()),
    fetchJson<number>(miaLegacyV2Url.toString()),
    fetchJson<number>(nycLegacyV1Url.toString()),
    fetchJson<number>(nycLegacyV2Url.toString()),
    fetchJson<number>(ccd003Url.toString()),
  ]);

  const processedArray = userIdsArray.map((result) =>
    result.status === "fulfilled" ? result.value : null
  );

  return {
    mia: {
      legacyV1: processedArray[0],
      legacyV2: processedArray[1],
    },
    nyc: {
      legacyV1: processedArray[2],
      legacyV2: processedArray[3],
    },
    ccd003: processedArray[4],
  };
}
