import { atomWithStorage } from "jotai/utils";
import {
  AddressBalanceResponse,
  CoreNodePoxResponse,
} from "@stacks/stacks-blockchain-api-types";
import {
  fetchAccountBalances,
  fetchCoreApiInfo,
  fetchPox,
} from "micro-stacks/api";
import { HIRO_API, formatMicroAmount } from "./common";
import { atom } from "jotai";

/////////////////////////
// TYPES
/////////////////////////

export type BlockHeights = {
  btc: number;
  stx: number;
};

export type RewardCycle = {
  currentCycle: number;
  startBlock: number;
  endBlock: number;
};

// type hack: API returns more data than API interface
interface UpdatedCoreNodePoxResponse extends CoreNodePoxResponse {
  pox_activation_threshold_ustx: number;
  current_burnchain_block_height: number;
  prepare_phase_block_length: number;
  reward_phase_block_length: number;
  reward_slots: number;
  current_cycle: {
    id: number;
    min_threshold_ustx: number;
    stacked_ustx: number;
    is_pox_active: boolean;
  };
  next_cycle: {
    id: number;
    min_threshold_ustx: number;
    min_increment_ustx: number;
    stacked_ustx: number;
    prepare_phase_start_block_height: number;
    blocks_until_prepare_phase: number;
    reward_phase_start_block_height: number;
    blocks_until_reward_phase: number;
    ustx_until_pox_rejection: number;
  };
  prepare_cycle_length: number;
  next_reward_cycle_in: number;
  contract_versions: Array<{
    contract_id: string;
    activation_burnchain_block_height: number;
    first_reward_cycle_id: number;
  }>;
}

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const blockHeightsAtom = atomWithStorage<BlockHeights | null>(
  "citycoins-stacks-blockHeights",
  null
);

export const stacksRewardCycleAtom = atomWithStorage<RewardCycle | null>(
  "citycoins-stacks-stacksRewardCycle",
  null
);

export const stxAddressAtom = atomWithStorage<string | null>(
  "citycoins-stacks-stxAddress",
  null
);

export const bnsNameAtom = atomWithStorage<string | null>(
  "citycoins-stacks-bnsName",
  null
);

export const acctTxsAtom = atomWithStorage("citycoins-stacks-acctTxs", null);

export const acctMempoolTxsAtom = atomWithStorage(
  "citycoins-stacks-acctMempoolTxs",
  null
);

export const accountBalancesAtom =
  atomWithStorage<AddressBalanceResponse | null>(
    "citycoins-stacks-accountBalances",
    null
  );

/////////////////////////
// DERIVED ATOMS
/////////////////////////

// TODO: make displayProfileName
//   BNS first, truncated address second
export const displayStxAddressAtom = atom((get) => {
  const stxAddress = get(stxAddressAtom);
  if (!stxAddress) return null;
  return `${stxAddress.slice(0, 5)}...${stxAddress.slice(-5)}`;
});

export const displayStxBalanceAtom = atom((get) => {
  const accountBalances = get(accountBalancesAtom);
  if (!accountBalances) return null;
  const stxBalance = Number(accountBalances.stx.balance);
  return formatMicroAmount(stxBalance, 6, 6);
});

// TODO: derived atom for displayCityCoinBalancesAtom
//   if fungible token name matches known token name
//   return formatted object for display of just CityCoins
export const displayTokenBalancesAtom = atom((get) => {
  const accountBalances = get(accountBalancesAtom);
  const formattedBalances: Record<string, string> = {};

  if (!accountBalances || !accountBalances.fungible_tokens) return null;

  for (const key in accountBalances.fungible_tokens) {
    const balance = accountBalances.fungible_tokens[key];
    if (balance) {
      const tokenName = key.split("::")[1];
      // TODO: assumes 6 decimal places
      formattedBalances[tokenName] = formatMicroAmount(Number(balance.balance));
    }
  }

  return formattedBalances;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const blockHeightsQueryAtom = atom(async () => {
  return await getBlockHeights();
});

/////////////////////////
// FETCH ATOMS
/////////////////////////

export const fetchBlockHeightsAtom = atom(
  (get) => get(blockHeightsAtom),
  async (_, set) => {
    try {
      const newBlockHeights = await getBlockHeights();
      set(blockHeightsAtom, newBlockHeights);
    } catch (error) {
      throw error;
    }
  }
);

export const fetchAccountBalancesAtom = atom(
  (get) => get(accountBalancesAtom),
  async (get, set) => {
    const stxAddress = get(stxAddressAtom);
    if (!stxAddress) {
      set(accountBalancesAtom, null);
      return;
    }
    try {
      const newBalances = await getAccountBalances(stxAddress);
      set(accountBalancesAtom, newBalances);
    } catch (error) {
      throw error;
    }
  }
);

export const fetchStacksRewardCycleAtom = atom(
  (get) => get(stacksRewardCycleAtom),
  async (_, set) => {
    try {
      const newStacksRewardCycle = await getStacksRewardCycle();
      set(stacksRewardCycleAtom, newStacksRewardCycle);
    } catch (error) {
      throw error;
    }
  }
);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

export async function getBlockHeights(): Promise<BlockHeights | null> {
  try {
    const v2InfoResponse = await fetchCoreApiInfo({
      url: HIRO_API,
    });
    const blockHeights: BlockHeights = {
      btc: v2InfoResponse.burn_block_height,
      stx: v2InfoResponse.stacks_tip_height,
    };
    return blockHeights;
  } catch (error) {
    throw new Error(`Failed to fetch v2-info in micro-stacks: ${error}`);
  }
}

export async function getStacksRewardCycle() {
  try {
    // TODO: type hack below due to mismatch in API interface
    const v2PoxResponse = (await fetchPox({
      url: HIRO_API,
    })) as UpdatedCoreNodePoxResponse;
    const stacksRewardCycle: RewardCycle = {
      currentCycle: v2PoxResponse.reward_cycle_id,
      startBlock:
        v2PoxResponse.next_cycle.reward_phase_start_block_height -
        v2PoxResponse.reward_cycle_length,
      endBlock: v2PoxResponse.next_cycle.reward_phase_start_block_height - 1,
    };
    return stacksRewardCycle;
  } catch (error) {
    throw new Error(`Failed to fetch v2-pox in micro-stacks: ${error}`);
  }
}
export async function getAccountBalances(stxAddress: string) {
  try {
    const accountBalances = await fetchAccountBalances({
      url: HIRO_API,
      principal: stxAddress,
    });
    return accountBalances;
  } catch (error) {
    throw new Error(
      `Failed to fetch account balances in micro-stacks: ${error}`
    );
  }
}
