import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { principalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type NycRedemptionInfo = {
  redemptionsEnabled: boolean;
  blockHeight: number;
  totalSupply: number;
  contractBalance: number;
  currentContractBalance: number;
  totalRedeemed: number;
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

type TokenSupplyInfo = {
  supplyV1: number;
  supplyV2: number;
  totalSupply: number;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccd012-redemption-nyc";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

export const NYC_ASSET_NAME = "newyorkcitycoin";

export const NYC_V1_CONTRACT_ADDRESS =
  "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5";
export const NYC_V1_CONTRACT_NAME = "newyorkcitycoin-token";

export const NYC_V2_CONTRACT_ADDRESS =
  "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11";
export const NYC_V2_CONTRACT_NAME = "newyorkcitycoin-token-v2";

export const STACKING_DAO_CONTRACT_ADDRESS =
  "SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG";
export const STACKING_DAO_CONTRACT_NAME = "cc-redemption-v1";
export const STACKING_DAO_FQ_NAME = `${STACKING_DAO_CONTRACT_ADDRESS}.${STACKING_DAO_CONTRACT_NAME}`;
export const STACKING_DAO_FUNCTION_NAME = "deposit";

export const LISA_CONTRACT_ADDRESS = "SPGAB1P3YV109E22KXFJYM63GK0G21BYX50CQ80B";
export const LISA_CONTRACT_NAME = "redeem-nyc-for-listx";
export const LISA_FQ_NAME = `${LISA_CONTRACT_ADDRESS}.${LISA_CONTRACT_NAME}`;
export const LISA_FUNCTION_NAME = "redeem-nyc-and-stack-with-lisa";

export const MICRO = (decimals: number) => Math.pow(10, decimals);

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccd012V1BalanceNYCLocalAtom = atomWithStorage<null | number>(
  "citycoins-ccd012-NYCV1Balance",
  null
);

export const ccd012V2BalanceNYCLocalAtom = atomWithStorage<null | number>(
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

export const ccd012stSTXRatioAtom = atomWithStorage<number | null>(
  "citycoins-ccd012-stSTXRatio",
  null
);

export const ccd012TxIdAtom = atomWithStorage<string | null>(
  "citycoins-ccd012-txid",
  null
);

export const ccd012NycTotalSupplyInfoLocalAtom =
  atomWithStorage<TokenSupplyInfo | null>(
    "citycoins-ccd012-nycTotalSupplyInfo",
    null
  );

export const ccd012LocalStorageAtoms = [
  ccd012V1BalanceNYCLocalAtom,
  ccd012V2BalanceNYCLocalAtom,
  ccd012IsRedemptionEnabledAtom,
  ccd012RedemptionInfoAtom,
  ccd012NycBalancesAtom,
  ccd012RedemptionForBalanceAtom,
  ccd012RedemptionAmountClaimedAtom,
  ccd012UserRedemptionInfoAtom,
  ccd012stSTXRatioAtom,
  ccd012TxIdAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const stSTXRatioAtom = atom(
  // getter
  (get) => get(ccd012stSTXRatioAtom),
  // setter
  async (get, set) => {
    const ratio = await get(getStackingDaoRatioQueryAtom);
    set(ccd012stSTXRatioAtom, ratio);
  }
);

export const v1BalanceNYCAtom = atom(
  // getter
  (get) => get(ccd012V1BalanceNYCLocalAtom),
  // setter
  async (get, set) => {
    const balance = await get(v1BalanceNYCQueryAtom);
    if (balance === undefined) return;
    if (typeof balance === "bigint") {
      try {
        set(ccd012V1BalanceNYCLocalAtom, getSafeNumberFromBigInt(balance));
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
        set(ccd012V2BalanceNYCLocalAtom, getSafeNumberFromBigInt(balance));
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

export const redemptionInfoAtom = atom(
  // getter
  (get) => get(ccd012RedemptionInfoAtom),
  // setter
  async (get, set) => {
    const redemptionInfo = await get(redemptionInfoQueryAtom);
    set(ccd012RedemptionInfoAtom, redemptionInfo);
  }
);

export const redemptionProgressAtom = atom(
  // getter
  (get) => {
    const redemptionInfo = get(redemptionInfoAtom);
    if (!redemptionInfo) return null;
    return (
      (redemptionInfo.totalRedeemed / redemptionInfo.contractBalance) * 100
    );
  }
);

export const nycBalancesAtom = atom(
  // getter
  (get) => get(ccd012NycBalancesAtom),
  // setter
  async (get, set) => {
    const nycBalances = await get(nycBalancesQueryAtom);
    if (!nycBalances) return;
    set(ccd012NycBalancesAtom, nycBalances);
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

export const redemptionAmountClaimed = atom(
  // getter
  (get) => get(ccd012RedemptionAmountClaimedAtom),
  // setter
  async (get, set) => {
    const redemptionAmountClaimed = await get(redemptionAmountClaimedQueryAtom);
    if (!redemptionAmountClaimed) return;
    set(ccd012RedemptionAmountClaimedAtom, redemptionAmountClaimed);
  }
);

export const userRedemptionInfoAtom = atom(
  // getter
  (get) => get(ccd012UserRedemptionInfoAtom),
  // setter
  async (get, set) => {
    const userRedemptionInfo = await get(userRedemptionInfoQueryAtom);
    if (!userRedemptionInfo) return;
    set(ccd012UserRedemptionInfoAtom, userRedemptionInfo);
  }
);

export const nycTotalSupplyInfoAtom = atom(
  // getter
  (get) => get(ccd012NycTotalSupplyInfoLocalAtom),
  // setter
  async (get, set) => {
    const supplyInfo = await get(getNycTotalSupplyInfoQueryAtom);
    set(ccd012NycTotalSupplyInfoLocalAtom, supplyInfo);
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

const getNycTotalSupplyInfoQueryAtom = atom(async () => {
  try {
    const supplyInfo = await getNycTotalSupplyInfo();
    // console.log("supplyInfo", supplyInfo);
    return supplyInfo;
  } catch (error) {
    throw new Error(
      `Failed to fetch NYC total supply info for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

const getStackingDaoRatioQueryAtom = atom(async () => {
  try {
    const ratio = await getStackingDaoRatio();
    return ratio;
  } catch (error) {
    throw new Error(
      `Failed to fetch stSTX ratio for ${STACKING_DAO_FQ_NAME}: ${error}`
    );
  }
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

function getSafeNumberFromBigInt(balance: bigint): number {
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
  const v1Balance = await fetchReadOnlyFunction<number>({
    contractAddress: NYC_V1_CONTRACT_ADDRESS,
    contractName: NYC_V1_CONTRACT_NAME,
    functionName: "get-balance",
    functionArgs: [principalCV(address)],
  });
  return v1Balance;
}

async function getV2Balance(address: string): Promise<number> {
  const v2Balance = await fetchReadOnlyFunction<number>({
    contractAddress: NYC_V2_CONTRACT_ADDRESS,
    contractName: NYC_V2_CONTRACT_NAME,
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

export async function getNycTotalSupplyInfo(): Promise<TokenSupplyInfo> {
  const totalSupplyV1 = await fetchReadOnlyFunction<bigint>({
    contractAddress: NYC_V1_CONTRACT_ADDRESS,
    contractName: NYC_V1_CONTRACT_NAME,
    functionName: "get-total-supply",
    functionArgs: [],
  });
  const totalSupplyV1Number = getSafeNumberFromBigInt(totalSupplyV1);

  //console.log("totalSupplyV1", typeof totalSupplyV1, totalSupplyV1);
  //console.log(
  //  "totalSupplyV1Number",
  //  typeof totalSupplyV1Number,
  //  totalSupplyV1Number
  //);

  const totalSupplyV2 = await fetchReadOnlyFunction<bigint>({
    contractAddress: NYC_V2_CONTRACT_ADDRESS,
    contractName: NYC_V2_CONTRACT_NAME,
    functionName: "get-total-supply",
    functionArgs: [],
  });
  const totalSupplyV2Number = getSafeNumberFromBigInt(totalSupplyV2);

  //console.log("totalSupplyV2", typeof totalSupplyV2, totalSupplyV2);
  //console.log(
  //  "totalSupplyV2Number",
  //  typeof totalSupplyV2Number,
  //  totalSupplyV2Number
  //);

  const totalSupply = totalSupplyV1Number * MICRO(6) + totalSupplyV2Number;

  //console.log(
  //  "totalSupply",
  //  typeof totalSupply,
  //  totalSupply,
  //  (totalSupply / MICRO(6)).toLocaleString()
  //);

  return {
    supplyV1: totalSupplyV1Number,
    supplyV2: totalSupplyV2Number,
    totalSupply: totalSupply,
  };
}

// helper to get the stSTX to STX ratio from the StackingDAO contract
// calls `get-stx-per-ststx` on `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v1`
// The param `reserve-contract` should be `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1`.
// example: return `u1015555`, meaning for 1.015555 STX you will get 1 stSTX.
export async function getStackingDaoRatio(): Promise<number> {
  const stackingDaoRatioQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: STACKING_DAO_CONTRACT_ADDRESS,
      contractName: "data-core-v1",
      functionName: "get-stx-per-ststx",
      functionArgs: [
        principalCV(`${STACKING_DAO_CONTRACT_ADDRESS}.reserve-v1`),
      ],
    },
    true
  );
  return stackingDaoRatioQuery;
}
