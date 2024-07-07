import { atomWithStorage } from "jotai/utils";
import { ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";
import { RewardCycle, accountBalancesAtom, stxAddressAtom } from "./stacks";
import { CC_API, CC_API_LEGACY, fetchJson, formatMicroAmount, VERSIONS } from "./common";
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
  id: number;
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

function checkContract(
  contractName: string,
  contractCallsMap: ContractFunctionMap
) {
  return contractCallsMap.hasOwnProperty(contractName);
}

function checkFunctionName(
  contractId: string,
  functionName: string,
  transactionCalls: ContractFunctionMap
): boolean {
  const expectedFunctionName = transactionCalls[contractId];
  if (Array.isArray(expectedFunctionName)) {
    return expectedFunctionName.includes(functionName);
  } else {
    return functionName === expectedFunctionName;
  }
}

// MINING TRANSACTIONS

const miningTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1": [
    "mine-tokens",
    "mine-many",
  ],
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2": [
    "mine-tokens",
    "mine-many",
  ],
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1": [
    "mine-tokens",
    "mine-many",
  ],
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2": [
    "mine-tokens",
    "mine-many",
  ],
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining": "mine",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2": "mine",
};

export const miningTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(tx.contract_call.contract_id, miningTransactionCalls) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          miningTransactionCalls
        )
    ) as ContractCallTransaction[];
  }
);

// MINING CLAIM TRANSACTIONS

const miningClaimTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1":
    "claim-mining-reward",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2":
    "claim-mining-reward",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "claim-mining-reward",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "claim-mining-reward",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining":
    "claim-mining-reward",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2":
    "claim-mining-reward",
};

export const miningClaimTransactionsAtom = atom(
  // read from current known txs
  (get) => {
    const transactions = get(transactionsAtom);
    return transactions.filter(
      (tx) =>
        tx.tx_type === "contract_call" &&
        checkContract(
          tx.contract_call.contract_id,
          miningClaimTransactionCalls
        ) &&
        checkFunctionName(
          tx.contract_call.contract_id,
          tx.contract_call.function_name,
          miningClaimTransactionCalls
        )
    );
  }
);

// STACKING TRANSACTIONS

const stackingTransactionCalls: ContractFunctionMap = {
  "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1": "stack-tokens",
  "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2": "stack-tokens",
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1":
    "stack-tokens",
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2":
    "stack-tokens",
  "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking": "stack",
};

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

export const isCitySelectedAtom = atom((get) => {
  const selectedCity = get(citycoinsSelectedCityAtom);
  return selectedCity !== null;
});

export const currentCityInfoAtom = atom((get) => {
  const selectedCity = get(citycoinsSelectedCityAtom);
  if (!selectedCity) return null;
  return CITY_INFO[selectedCity];
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
