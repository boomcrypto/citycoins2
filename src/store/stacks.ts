import { atomWithStorage } from "jotai/utils";
import {
  AddressTransactionsWithTransfersListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API, fancyFetch, sleep } from "./common";
import { Setter, atom } from "jotai";
import LZString from "lz-string";
import { decodeTxArgs, isValidMiningTxArgs, isValidMiningClaimTxArgs, isValidStackingTxArgs, isValidStackingClaimTxArgs } from "../utilities/transactions";

/////////////////////////
// TYPES
/////////////////////////

type BlockHeights = {
  btc: number;
  stx: number;
};

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const blockHeightsAtom = atomWithStorage<BlockHeights | null>(
  "citycoins-stacks-blocks",
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

export const acctTxsAtom = atomWithStorage<string>(
  "citycoins-stacks-acctTxs",
  ""
);

export const acctMempoolTxsAtom = atomWithStorage<Transaction[]>(
  "citycoins-stacks-acctMempoolTxs",
  []
);

export const acctBalancesAtom = atomWithStorage(
  "citycoins-stacks-acctBalances",
  null
);

// New: User ID cache per city (for core) and shared (for ccd003)
export const userIdsAtom = atomWithStorage<Record<string, string | null>>(
  "citycoins-stacks-userIds",
  {} // e.g., { 'mia-core-legacyV1': '123', 'ccd003-shared': '456' }
);

// Helper to generate user ID cache key
export function getUserIdKey(city: 'mia' | 'nyc', module: 'core' | 'mining' | 'stacking' | 'token', version?: 'legacyV1' | 'legacyV2' | 'daoV1' | 'daoV2'): string {
  if (module === 'core') {
    return `${city}-core-${version}`;
  } else if (module === 'mining' || module === 'stacking') {
    return 'ccd003-shared';
  }
  // token has no user ID
  throw new Error(`Unsupported module for user ID: ${module}`);
}

export const stacksLocalStorageAtoms = [
  blockHeightsAtom,
  stxAddressAtom,
  bnsNameAtom,
  acctTxsAtom,
  acctMempoolTxsAtom,
  acctBalancesAtom,
  userIdsAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const decompressedAcctTxsAtom = atom((get) => {
  const acctTxs = get(acctTxsAtom);
  if (!acctTxs) return [];
  try {
    const decompressedTxs: Transaction[] = JSON.parse(
      LZString.decompress(acctTxs)
    );
    return decompressedTxs;
  } catch (error) {
    console.error("Failed to decompress transactions", error);
    return [];
  }
});

export const transactionsAtom = atom(
  // read from localstorage
  (get) => {
    const acctTxs = get(decompressedAcctTxsAtom);
    if (!acctTxs) return [];
    return acctTxs;
  },
  // update by writing to localstorage
  async (get, set, update: Transaction[]) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    console.log("starting fetch of all txs");
    set(transactionFetchStatusAtom, {
      isLoading: true,
      error: null,
      progress: 0,
    });
    try {
      const newTxs = await getAllTxs(address, update, set);
      console.log("fetch complete, setting acctTxsAtom");
      set(transactionFetchStatusAtom, {
        isLoading: false,
        error: null,
        progress: 100,
      });
      const compressedTxs = LZString.compress(JSON.stringify(newTxs));
      set(acctTxsAtom, compressedTxs);
    } catch (error) {
      throw error;
    }
  }
);

export const minedBlocksAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const map = new Map<string, number[]>();
  for (const tx of transactions) {
    if (tx.tx_type === 'contract_call' && ['mine-tokens', 'mine-many', 'mine'].includes(tx.contract_call.function_name)) {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidMiningTxArgs(decoded)) {
        const numBlocks = decoded.amountsUstx.length;
        const blocks = [];
        for (let i = 0; i < numBlocks; i++) {
          blocks.push(tx.block_height + i);
        }
        map.set(tx.tx_id, blocks);
      }
    }
  }
  return map;
});

export const claimedBlocksAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const map = new Map<string, number[]>();
  for (const tx of transactions) {
    if (tx.tx_type === 'contract_call' && tx.contract_call.function_name === 'claim-mining-reward') {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidMiningClaimTxArgs(decoded)) {
        const block = Number(decoded.minerBlockHeight);
        map.set(tx.tx_id, [block]);
      }
    }
  }
  return map;
});

export const stackedCyclesAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const map = new Map<string, number[]>();
  for (const tx of transactions) {
    if (tx.tx_type === 'contract_call' && tx.contract_call.function_name === 'stack-tokens') {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidStackingTxArgs(decoded)) {
        const lockPeriod = Number(decoded.lockPeriod);
        // For NYC, genesis block 24497, cycle length 2100
        const genesisBlock = 24497;
        const cycleLength = 2100;
        const startCycle = Math.floor((tx.block_height - genesisBlock) / cycleLength) + 1;
        const cycles = Array.from({length: lockPeriod}, (_, i) => startCycle + i);
        map.set(tx.tx_id, cycles);
      }
    }
  }
  return map;
});

export const claimedCyclesAtom = atom((get) => {
  const transactions = get(transactionsAtom);
  const map = new Map<string, number[]>();
  for (const tx of transactions) {
    if (tx.tx_type === 'contract_call' && tx.contract_call.function_name === 'claim-stacking-reward') {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidStackingClaimTxArgs(decoded)) {
        const cycle = Number(decoded.rewardCycle);
        map.set(tx.tx_id, [cycle]);
      }
    }
  }
  return map;
});

type FetchStatus = {
  isLoading: boolean;
  error: string | null;
  progress: number;
};

export const transactionFetchStatusAtom = atom<FetchStatus>({
  isLoading: false,
  error: null,
  progress: 0,
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const blockHeightsQueryAtom = atom(async () => {
  return await getBlockHeights();
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

async function getBlockHeights(): Promise<BlockHeights | undefined> {
  try {
    const v2InfoResponse = await fetch(`${HIRO_API}/v2/info`);
    const v2Info = await v2InfoResponse.json();
    if (!v2Info.burn_block_height || !v2Info.stacks_tip_height) {
      const blockHeights: BlockHeights = {
        btc: v2Info.burn_block_height,
        stx: v2Info.stacks_tip_height,
      };
      return blockHeights;
    } else {
      throw new Error("Incomplete v2-info response: missing block heights");
    }
  } catch (error) {
    throw new Error(`Failed to fetch v2-info: ${error}`);
  }
}

async function getAllTxs(
  address: string,
  existingTxs: Transaction[],
  atomSetter: Setter
) {
  try {
    // set fetch parameters and vars
    const endpoint = `${HIRO_API}/extended/v2/addresses/${address}/transactions`;
    const limit = 50;
    let offset = 0;
    let totalTransactions = 0;
    // get initial response for transaction total
    const initialResponse =
      await fancyFetch<AddressTransactionsWithTransfersListResponse>(
        `${endpoint}?limit=${limit}`
      );
    totalTransactions = initialResponse.total;
    console.log(totalTransactions, "total transactions");
    // return if all transactions are already loaded
    if (existingTxs.length === totalTransactions) {
      console.log("all transactions already loaded");
      return existingTxs;
    }
    // create array of new transactions
    // console.log("initialResponse", initialResponse);
    const newTransactions = initialResponse.results.map(
      (txRecord) => txRecord.tx
    );
    console.log(newTransactions.length, "new transactions");
    // console.log(newTransactions);
    // create array of unique transactions
    const uniqueTransactions = [
      ...existingTxs,
      ...newTransactions.filter(
        (tx) => !existingTxs.some((knownTx) => knownTx?.tx_id === tx.tx_id)
      ),
    ];
    console.log(uniqueTransactions.length, "unique transactions");
    // return if all transactions are now loaded
    if (uniqueTransactions.length === totalTransactions) {
      console.log("all transactions now loaded");
      return uniqueTransactions;
    }
    // loop until all transactions are loaded
    while (uniqueTransactions.length < totalTransactions) {
      await sleep(500); // rate limiting
      offset += limit;
      console.log("new loop, offset:", offset);
      const response =
        await fancyFetch<AddressTransactionsWithTransfersListResponse>(
          `${endpoint}?limit=${limit}&offset=${offset}`
        );
      // get transactions from response
      const additionalTransactions = response.results.map(
        (txRecord) => txRecord.tx
      );
      console.log(additionalTransactions.length, "additional transactions");
      // filter out transactions already known
      const uniqueAdditionalTransactions = additionalTransactions.filter(
        (tx) =>
          !uniqueTransactions.some((knownTx) => knownTx?.tx_id === tx.tx_id)
      );
      console.log(
        uniqueAdditionalTransactions.length,
        "unique additional transactions"
      );
      // add new transactions to uniqueTransactions
      uniqueTransactions.push(...uniqueAdditionalTransactions);
      console.log(uniqueTransactions.length, "total unique transactions");
      // update progress for front-end
      const progress = Math.round(
        (uniqueTransactions.length / totalTransactions) * 100
      );
      atomSetter(transactionFetchStatusAtom, (prev) => ({
        ...prev,
        progress,
      }));
    }
    // return all transactions
    return uniqueTransactions;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    } else {
      throw new Error(`Failed to fetch transactions: ${String(error)}`);
    }
  }
}
