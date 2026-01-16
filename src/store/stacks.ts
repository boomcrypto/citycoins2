import { atomWithStorage } from "jotai/utils";
import {
  AddressTransactionsWithTransfersListResponse,
  AddressTransactionsListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API, fancyFetch, sleep } from "./common";
import { Setter, atom } from "jotai";
import LZString from "lz-string";
import { decodeTxArgs, isValidMiningTxArgs, isValidMiningClaimTxArgs, isValidStackingTxArgs, isValidStackingClaimTxArgs } from "../utilities/transactions";
import { fetchAllUserIds, UserIds } from "../utilities/claim-verification";

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

/**
 * User IDs across all contract versions.
 *
 * - Legacy: Per-city, per-version IDs from each core contract
 * - DAO: Shared ID from ccd003-user-registry
 *
 * Cached indefinitely (clear data button resets all atoms).
 */
export const userIdsAtom = atomWithStorage<UserIds | null>(
  "citycoins-user-ids",
  null
);

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
// USER ID FETCH STATUS
/////////////////////////

export type UserIdFetchStatus = {
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
};

export const userIdFetchStatusAtom = atom<UserIdFetchStatus>({
  isLoading: false,
  error: null,
  lastFetched: null,
});

/**
 * Action atom to fetch all user IDs for the current address.
 *
 * This fetches user IDs from:
 * - Legacy API: Per-city, per-version (MIA v1/v2, NYC v1/v2)
 * - Protocol API: Shared DAO ID from ccd003
 *
 * All requests go through the rate-limited fetch utility.
 * Results are cached indefinitely in localStorage.
 */
export const fetchUserIdsAtom = atom(
  null,
  async (get, set) => {
    const address = get(stxAddressAtom);
    if (!address) {
      console.log("[fetchUserIds] No address, skipping");
      return;
    }

    // Check if we already have user IDs cached
    const existingIds = get(userIdsAtom);
    if (existingIds) {
      console.log("[fetchUserIds] User IDs already cached");
      return;
    }

    console.log("[fetchUserIds] Fetching user IDs for:", address);
    set(userIdFetchStatusAtom, {
      isLoading: true,
      error: null,
      lastFetched: null,
    });

    try {
      const result = await fetchAllUserIds(address);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      set(userIdsAtom, result.data);
      set(userIdFetchStatusAtom, {
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      });

      console.log("[fetchUserIds] User IDs fetched:", result.data);
    } catch (error) {
      console.error("[fetchUserIds] Error:", error);
      set(userIdFetchStatusAtom, {
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
        lastFetched: null,
      });
    }
  }
);

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
      // Save whatever transactions we have so far
      console.error("Error fetching transactions, saving partial results:", error);
      set(transactionFetchStatusAtom, {
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
        progress: 0,
      });
      // Don't throw - we want to keep partial results
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
    if (v2Info.burn_block_height && v2Info.stacks_tip_height) {
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
  // Use v1 endpoint which supports offset pagination (v2 uses cursor-based)
  const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
  const limit = 50;
  let offset = 0;
  let totalTransactions = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  // Use a Map for O(1) deduplication (tx_id -> transaction)
  const txMap = new Map<string, Transaction>();

  // Add existing transactions to map
  for (const tx of existingTxs) {
    if (tx?.tx_id) txMap.set(tx.tx_id, tx);
  }
  const existingCount = txMap.size;

  // Helper to get array from map and save
  const getTransactions = () => Array.from(txMap.values());
  const saveProgress = () => {
    const txs = getTransactions();
    const compressedTxs = LZString.compress(JSON.stringify(txs));
    atomSetter(acctTxsAtom, compressedTxs);
    console.log(`Saved ${txs.length} transactions to storage`);
  };

  try {
    // Get initial response for transaction total
    const initialResponse =
      await fancyFetch<AddressTransactionsListResponse>(
        `${endpoint}?limit=${limit}`
      );
    totalTransactions = initialResponse.total;
    console.log(totalTransactions, "total transactions from API");

    // Return if all transactions are already loaded
    if (existingCount === totalTransactions) {
      console.log("all transactions already loaded");
      return existingTxs;
    }

    // Process initial fetch - v1 returns transactions directly in results
    const newTransactions = initialResponse.results as Transaction[];
    console.log(newTransactions.length, "transactions from initial fetch");

    let addedCount = 0;
    for (const tx of newTransactions) {
      if (tx?.tx_id && !txMap.has(tx.tx_id)) {
        txMap.set(tx.tx_id, tx);
        addedCount++;
      }
    }
    console.log(addedCount, "new unique,", txMap.size, "total after initial fetch");

    // Update progress
    atomSetter(transactionFetchStatusAtom, (prev) => ({
      ...prev,
      progress: Math.round(limit / totalTransactions * 100),
    }));

    // Save after initial fetch
    saveProgress();

    // Return if we've fetched everything or API returned less than limit
    if (newTransactions.length < limit || limit >= totalTransactions) {
      console.log("all transactions fetched");
      return getTransactions();
    }

    // Loop to fetch remaining transactions
    while (offset + limit < totalTransactions) {
      await sleep(1500); // Rate limiting
      offset += limit;
      console.log(`Fetching offset ${offset} of ${totalTransactions}`);

      try {
        const response =
          await fancyFetch<AddressTransactionsListResponse>(
            `${endpoint}?limit=${limit}&offset=${offset}`
          );

        consecutiveErrors = 0; // Reset on success

        // v1 returns transactions directly in results
        const additionalTransactions = response.results as Transaction[];
        console.log(additionalTransactions.length, "transactions fetched");
        if (additionalTransactions.length > 0) {
          console.log("First tx_id at offset", offset + ":", additionalTransactions[0]?.tx_id?.slice(0, 16));
        }

        // Add unique transactions to map
        let batchAdded = 0;
        for (const tx of additionalTransactions) {
          if (tx?.tx_id && !txMap.has(tx.tx_id)) {
            txMap.set(tx.tx_id, tx);
            batchAdded++;
          }
        }
        console.log(batchAdded, "new unique,", txMap.size, "total");

        // Update progress based on offset
        const progress = Math.min(
          Math.round((offset + limit) / totalTransactions * 100),
          100
        );
        atomSetter(transactionFetchStatusAtom, (prev) => ({
          ...prev,
          progress,
        }));

        // Save every 500 transactions
        if (offset % 500 === 0) {
          saveProgress();
        }

        // Stop if API returned fewer than requested (end of data)
        if (additionalTransactions.length < limit) {
          console.log("Reached end of transactions (partial page)");
          break;
        }
      } catch (fetchError) {
        consecutiveErrors++;
        console.error(`Fetch error (${consecutiveErrors}/${maxConsecutiveErrors}):`, fetchError);

        // Save progress on error
        saveProgress();

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error("Too many errors, returning partial results");
          return getTransactions();
        }

        // Exponential backoff: 5s, 10s, 20s
        const backoffTime = 5000 * Math.pow(2, consecutiveErrors - 1);
        console.log(`Backing off for ${backoffTime / 1000}s...`);
        await sleep(backoffTime);
        offset -= limit; // Retry same offset
      }
    }

    // Final save
    saveProgress();
    return getTransactions();

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    } else {
      throw new Error(`Failed to fetch transactions: ${String(error)}`);
    }
  }
}
