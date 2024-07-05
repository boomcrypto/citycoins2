import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { principalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

type NycRedemptionInfo = {
  redemptionsEnabled: boolean;
  blockHeight: number;
  totalSupply: number;
  contractBalance: number;
  redemptionRatio: number;
};

type AddressNycBalances = {
  address: string;
  balanceV1: number;
  balanceV2: number;
  totalBalance: number;
};

type AddressNycRedemptionInfo = {
  address: string;
  nycBalances: AddressNycBalances;
  redemptionAmount: number;
  redemptionClaims: number;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccd012-redemption-nyc";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

export const MICRO = (decimals: number) => Math.pow(10, decimals);

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

const ccd012V1BalanceNYCLocalAtom = atomWithStorage<null | number>(
  "citycoins-ccd012-NYCV1Balance",
  null
);

const ccd012V2BalanceNYCLocalAtom = atomWithStorage<null | number>(
  "citycoins-ccd012-NYCV2Balance",
  null
);

export const ccd012IsRedemptionEnabledAtom = atomWithStorage(
  "citycoins-ccd012-isRedemptionEnabled",
  false
);

export const ccd012RedemptionInfoAtom =
  atomWithStorage<NycRedemptionInfo | null>(
    "citycoins-ccd012-redemptionInfo",
    null
  );

export const ccd012NycBalancesAtom = atomWithStorage<AddressNycBalances | null>(
  "citycoins-ccd012-nycBalances",
  null
);

export const ccd012RedemptionForBalanceAtom = atomWithStorage<number | null>(
  "citycoins-ccd012-redemptionForBalance",
  null
);

export const ccd012RedemptionAmountClaimedAtom = atomWithStorage<number | null>(
  "citycoins-ccd012-redemptionAmountClaimed",
  null
);

export const ccd012UserRedemptionInfoAtom =
  atomWithStorage<AddressNycRedemptionInfo | null>(
    "citycoins-ccd012-userRedemptionInfo",
    null
  );

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const v1BalanceNYCAtom = atom(
  // getter
  (get) => get(ccd012V1BalanceNYCLocalAtom),
  // setter
  async (get, set) => {
    const balance = await get(v1BalanceNYCQueryAtom);
    if (balance === undefined) return;
    if (typeof balance === "bigint") {
      try {
        set(ccd012V1BalanceNYCLocalAtom, getBalanceFromBigint(balance));
      } catch (error) {
        console.error(`Failed to set v1BalanceAtom with bigint: ${error}`);
      }
    } else if (typeof balance === "number") {
      set(ccd012V1BalanceNYCLocalAtom, balance);
    }
  }
);

export const v2BalanceNYCAtom = atom(
  // getter
  (get) => get(ccd012V2BalanceNYCLocalAtom),
  // setter
  async (get, set) => {
    const balance = await get(v2BalanceNYCQueryAtom);
    if (balance === undefined) return;
    if (typeof balance === "bigint") {
      try {
        set(ccd012V2BalanceNYCLocalAtom, getBalanceFromBigint(balance));
      } catch (error) {
        console.error(`Failed to set v2BalanceAtom with bigint: ${error}`);
      }
    } else if (typeof balance === "number") {
      set(ccd012V2BalanceNYCLocalAtom, balance);
    }
  }
);

export const totalBalanceNYCAtom = atom((get) => {
  const v1Balance = (get(v1BalanceNYCAtom) ?? 0) * MICRO(6);
  const v2Balance = get(v2BalanceNYCAtom) ?? 0;
  return v1Balance + v2Balance;
});

export const isRedemptionEnabledAtom = atom(
  // getter
  (get) => get(ccd012IsRedemptionEnabledAtom),
  // setter
  async (get, set) => {
    const isRedemptionEnabled = await get(isRedemptionEnabledQueryAtom);
    set(ccd012IsRedemptionEnabledAtom, isRedemptionEnabled);
  }
);

export const redemptionForBalanceAtom = atom(
  // getter
  (get) => get(ccd012RedemptionForBalanceAtom),
  // setter
  async (get, set) => {
    const redemptionForBalance = await get(redemptionForBalanceQueryAtom);
    set(ccd012RedemptionForBalanceAtom, redemptionForBalance);
  }
);

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

const v1BalanceNYCQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const v1Balance = await getV1Balance(stxAddress);
    return v1Balance;
  } catch (error) {
    throw new Error(
      `Failed to fetch NYC V1 balance for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const v2BalanceNYCQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const v2Balance = await getV2Balance(stxAddress);
    return v2Balance;
  } catch (error) {
    throw new Error(
      `Failed to fetch NYC V2 balance for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const isRedemptionEnabledQueryAtom = atom(async () => {
  try {
    const redemptionEnabled = await isRedemptionEnabled();
    return redemptionEnabled;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-redemption-enabled for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const redemptionInfoQueryAtom = atom(async () => {
  try {
    const redemptionInfo = await getRedemptionInfo();
    return redemptionInfo;
  } catch (error) {
    throw new Error(
      `Failed to fetch redemption-info for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const nycBalancesQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const nycBalances = await getNycBalances(stxAddress);
    return nycBalances;
  } catch (error) {
    throw new Error(
      `Failed to fetch nyc-balances for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const redemptionForBalanceQueryAtom = atom(async (get) => {
  const totalBalance = get(totalBalanceNYCAtom);
  try {
    const redemptionForBalance = await getRedemptionForBalance(totalBalance);
    return redemptionForBalance;
  } catch (error) {
    throw new Error(
      `Failed to fetch redemption-for-balance for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const redemptionAmountClaimedQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const redemptionAmountClaimed = await getRedemptionAmountClaimed(
      stxAddress
    );
    return redemptionAmountClaimed;
  } catch (error) {
    throw new Error(
      `Failed to fetch redemption-amount-claimed for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const userRedemptionInfoQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const userRedemptionInfo = await getUserRedemptionInfo(stxAddress);
    return userRedemptionInfo;
  } catch (error) {
    throw new Error(
      `Failed to fetch user-redemption-info for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

function getBalanceFromBigint(balance: bigint): number {
  const numberBalance = Number(balance);
  if (Number.isSafeInteger(numberBalance)) {
    return numberBalance;
  } else {
    throw new Error(
      "BigInt value is too large to be safely converted to number"
    );
  }
}

async function getV1Balance(address: string): Promise<number> {
  const v1TokenContractAddress = "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5";
  const v1TokenContractName = "newyorkcitycoin-token";
  const v1Balance = await fetchReadOnlyFunction<number>({
    contractAddress: v1TokenContractAddress,
    contractName: v1TokenContractName,
    functionName: "get-balance",
    functionArgs: [principalCV(address)],
  });
  return v1Balance;
}

async function getV2Balance(address: string): Promise<number> {
  const v2TokenContractAddress = "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11";
  const v2TokenContractName = "newyorkcitycoin-token-v2";
  const v2Balance = await fetchReadOnlyFunction<number>({
    contractAddress: v2TokenContractAddress,
    contractName: v2TokenContractName,
    functionName: "get-balance",
    functionArgs: [principalCV(address)],
  });
  return v2Balance;
}

async function isRedemptionEnabled(): Promise<boolean> {
  const isRedemptionEnabledQuery = await fetchReadOnlyFunction<boolean>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-redemption-enabled",
      functionArgs: [],
    },
    true
  );
  return isRedemptionEnabledQuery;
}

async function getRedemptionInfo(): Promise<NycRedemptionInfo> {
  const redemptionInfoQuery = await fetchReadOnlyFunction<NycRedemptionInfo>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-redemption-info",
      functionArgs: [],
    },
    true
  );
  return redemptionInfoQuery;
}

async function getNycBalances(address: string): Promise<AddressNycBalances> {
  const nycBalancesQuery = await fetchReadOnlyFunction<AddressNycBalances>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-nyc-balances",
      functionArgs: [address],
    },
    true
  );
  return nycBalancesQuery;
}

async function getRedemptionForBalance(
  balance: number
): Promise<null | number> {
  const redemptionForBalanceQuery = await fetchReadOnlyFunction<null | number>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-redemption-for-balance",
      functionArgs: [uintCV(balance)],
    },
    true
  );
  return redemptionForBalanceQuery;
}

async function getRedemptionAmountClaimed(address: string): Promise<number> {
  const redemptionAmountClaimedQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-redemption-amount-claimed",
      functionArgs: [principalCV(address)],
    },
    true
  );
  return redemptionAmountClaimedQuery;
}

async function getUserRedemptionInfo(
  address: string
): Promise<AddressNycRedemptionInfo> {
  const userRedemptionInfoQuery =
    await fetchReadOnlyFunction<AddressNycRedemptionInfo>(
      {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-user-redemption-info",
        functionArgs: [principalCV(address)],
      },
      true
    );
  return userRedemptionInfoQuery;
}
