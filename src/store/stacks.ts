import { atomWithStorage } from "jotai/utils";
import {
  AddressTransactionsWithTransfersListResponse,
  AddressTransactionsListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API } from "./common";
import { hiroFetch } from "../utilities/hiro-client";
import { Getter, Setter, atom } from "jotai";
import LZString from "lz-string";
import { decodeTxArgs, isValidMiningTxArgs, isValidMiningClaimTxArgs, isValidStackingTxArgs, isValidStackingClaimTxArgs } from "../utilities/transactions";
import { fetchAllUserIds, UserIds } from "../utilities/claim-verification";
import {
  canSaveData,
  emitStorageWarning,
  getStorageInfo,
  getStringByteSize,
  isQuotaExceededError,
} from "../utilities/storage-monitor";

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

// =============================================================================
// PER-ACCOUNT STORAGE
//
// Each per-account atom is backed by a `Record<address, value>` in
// localStorage. The legacy single-key atoms are derived: they read/write the
// slice for the currently-connected wallet. This keeps state isolated when the
// user switches accounts and prevents leftover work (verification, refetches)
// from polluting the new account's cache.
// =============================================================================

export const bnsNameByAddressAtom = atomWithStorage<Record<string, string | null>>(
  "citycoins-stacks-bnsName-by-address",
  {}
);

export const bnsNameAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    if (!address) return null;
    return get(bnsNameByAddressAtom)[address] ?? null;
  },
  (get, set, value: string | null) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    const current = get(bnsNameByAddressAtom);
    set(bnsNameByAddressAtom, { ...current, [address]: value });
  }
);

export const acctTxsByAddressAtom = atomWithStorage<Record<string, string>>(
  "citycoins-stacks-acctTxs-by-address",
  {}
);

export const acctTxsAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    if (!address) return "";
    return get(acctTxsByAddressAtom)[address] ?? "";
  },
  (get, set, value: string) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    const current = get(acctTxsByAddressAtom);
    set(acctTxsByAddressAtom, { ...current, [address]: value });
  }
);

export const acctMempoolTxsByAddressAtom = atomWithStorage<Record<string, Transaction[]>>(
  "citycoins-stacks-acctMempoolTxs-by-address",
  {}
);

export const acctMempoolTxsAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    if (!address) return [];
    return get(acctMempoolTxsByAddressAtom)[address] ?? [];
  },
  (get, set, value: Transaction[]) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    const current = get(acctMempoolTxsByAddressAtom);
    set(acctMempoolTxsByAddressAtom, { ...current, [address]: value });
  }
);

export const acctBalancesByAddressAtom = atomWithStorage<Record<string, unknown>>(
  "citycoins-stacks-acctBalances-by-address",
  {}
);

export const acctBalancesAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    if (!address) return null;
    return get(acctBalancesByAddressAtom)[address] ?? null;
  },
  (get, set, value: unknown) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    const current = get(acctBalancesByAddressAtom);
    set(acctBalancesByAddressAtom, { ...current, [address]: value });
  }
);

/**
 * User IDs across all contract versions.
 *
 * - Legacy: Per-city, per-version IDs from each core contract
 * - DAO: Shared ID from ccd003-user-registry
 *
 * Cached indefinitely (clear data button resets the current address's slice).
 */
export const userIdsByAddressAtom = atomWithStorage<Record<string, UserIds | null>>(
  "citycoins-user-ids-by-address",
  {}
);

export const userIdsAtom = atom(
  (get) => {
    const address = get(stxAddressAtom);
    if (!address) return null;
    return get(userIdsByAddressAtom)[address] ?? null;
  },
  (get, set, value: UserIds | null) => {
    const address = get(stxAddressAtom);
    if (!address) return;
    const current = get(userIdsByAddressAtom);
    set(userIdsByAddressAtom, { ...current, [address]: value });
  }
);

/**
 * Per-account storage atoms. Used by `useClearUserData` to wipe the current
 * wallet's slice without touching other accounts' caches. `stxAddressAtom` and
 * `blockHeightsAtom` are intentionally absent — address is identity (cleared
 * separately on logout) and block heights are chain state, not account state.
 */
export const perAddressStorageAtoms = [
  bnsNameByAddressAtom,
  acctTxsByAddressAtom,
  acctMempoolTxsByAddressAtom,
  acctBalancesByAddressAtom,
  userIdsByAddressAtom,
];

export const stacksLocalStorageAtoms = [
  blockHeightsAtom,
  stxAddressAtom,
  bnsNameByAddressAtom,
  acctTxsByAddressAtom,
  acctMempoolTxsByAddressAtom,
  acctBalancesByAddressAtom,
  userIdsByAddressAtom,
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
      return;
    }

    // Check if we already have user IDs cached
    const existingIds = get(userIdsAtom);
    if (existingIds) {
      return;
    }

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
    } catch (error) {
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

/**
 * Project a Hiro `Transaction` to only the fields this app actually
 * consumes. Events, post_conditions, raw_tx, microblock/execution_cost
 * metadata, etc. are dropped to keep localStorage usage reasonable —
 * a single mining/claim tx is dominated by `events`, so stripping
 * yields a large size reduction.
 *
 * The return type is declared as `Transaction` for downstream
 * compatibility, but the runtime object only contains the fields below.
 * This boundary cast is safe because no consumer of stored transactions
 * reads the dropped fields.
 */
function toStoredTx(tx: Transaction): Transaction {
  if (!tx) return tx;
  const slim: Record<string, unknown> = {
    tx_id: tx.tx_id,
    tx_status: tx.tx_status,
    tx_type: tx.tx_type,
    block_height: (tx as { block_height?: number }).block_height,
    block_time_iso: (tx as { block_time_iso?: string }).block_time_iso,
    burn_block_height: (tx as { burn_block_height?: number }).burn_block_height,
  };
  if (tx.tx_type === "contract_call") {
    const cc = tx.contract_call;
    slim.contract_call = {
      contract_id: cc.contract_id,
      function_name: cc.function_name,
      function_args: cc.function_args,
    };
  }
  return slim as unknown as Transaction;
}

/**
 * Detect transactions that still carry fields we no longer store.
 * Used by the one-shot migration to recompress legacy caches.
 */
function txHasLegacyFields(tx: unknown): boolean {
  if (!tx || typeof tx !== "object") return false;
  return (
    "events" in tx ||
    "post_conditions" in tx ||
    "raw_tx" in tx ||
    "execution_cost_read_count" in tx
  );
}

/**
 * Memoization cache for decompressed transactions.
 *
 * Without memoization, LZ-string decompression runs on every atom read,
 * which at 10k transactions takes ~50ms per read. With memoization,
 * decompression only runs when the compressed data actually changes.
 */
let cachedDecompressedTxs: Transaction[] | null = null;
let cachedCompressedString: string | null = null;

export const decompressedAcctTxsAtom = atom((get) => {
  const acctTxs = get(acctTxsAtom);

  // Handle empty input
  if (!acctTxs) {
    cachedCompressedString = null;
    cachedDecompressedTxs = null;
    return [];
  }

  // Return cached result if compressed data hasn't changed
  if (acctTxs === cachedCompressedString && cachedDecompressedTxs !== null) {
    return cachedDecompressedTxs;
  }

  // Decompress and cache. Project through `toStoredTx` so any legacy
  // bloated entries in localStorage are slimmed before reaching consumers.
  try {
    const parsed: Transaction[] = JSON.parse(LZString.decompress(acctTxs));
    const decompressedTxs = parsed.map(toStoredTx);
    cachedCompressedString = acctTxs;
    cachedDecompressedTxs = decompressedTxs;
    return decompressedTxs;
  } catch (error) {
    console.error("Failed to decompress transactions", error);
    cachedCompressedString = null;
    cachedDecompressedTxs = null;
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
    set(transactionFetchStatusAtom, {
      isLoading: true,
      error: null,
      progress: 0,
    });
    try {
      const newTxs = await getAllTxs(address, update, get, set);
      set(transactionFetchStatusAtom, {
        isLoading: false,
        error: null,
        progress: 100,
      });
      const compressedTxs = LZString.compress(JSON.stringify(newTxs));
      set(acctTxsAtom, compressedTxs);
    } catch (error) {
      // Save whatever transactions we have so far
      set(transactionFetchStatusAtom, {
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
        progress: 0,
      });
      // Don't throw - we want to keep partial results
    }
  }
);

/**
 * One-shot migration: detect legacy fat transactions in localStorage and
 * rewrite them slimmed. Safe to invoke at app mount; no-op when the
 * cached blob is already slim or absent. Failures are swallowed —
 * a broken cache will simply be re-fetched on the next refresh.
 */
export const migrateStoredTxsAtom = atom(null, (get, set) => {
  const compressed = get(acctTxsAtom);
  if (!compressed) return;
  try {
    const parsed = JSON.parse(LZString.decompress(compressed)) as Transaction[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    if (!parsed.some(txHasLegacyFields)) return;
    const slim = parsed.map(toStoredTx);
    set(acctTxsAtom, LZString.compress(JSON.stringify(slim)));
  } catch {
    // Ignore — corrupt cache will be refetched.
  }
});

/**
 * One-shot migration: move legacy single-key per-account caches into the new
 * by-address records, scoped to the currently connected wallet. Without this,
 * existing users would lose their cached transactions / user IDs on upgrade
 * and have to re-fetch from scratch. No-op when no legacy keys are present or
 * when no wallet is connected (we don't know which address to assign the data
 * to). Old keys are removed after a successful migration.
 */
const LEGACY_ACCOUNT_KEYS = [
  "citycoins-stacks-acctTxs",
  "citycoins-stacks-acctMempoolTxs",
  "citycoins-stacks-acctBalances",
  "citycoins-stacks-bnsName",
  "citycoins-user-ids",
] as const;

function readLegacyJSON<T>(key: string): T | undefined {
  const raw = localStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export const migrateAccountAtomsByAddressAtom = atom(null, (get, set) => {
  const address = get(stxAddressAtom);
  if (!address) return;

  // acctTxs (string)
  const legacyTxs = readLegacyJSON<string>("citycoins-stacks-acctTxs");
  if (typeof legacyTxs === "string" && legacyTxs.length > 0) {
    const current = get(acctTxsByAddressAtom);
    if (current[address] === undefined) {
      set(acctTxsByAddressAtom, { ...current, [address]: legacyTxs });
    }
  }

  // acctMempoolTxs (Transaction[])
  const legacyMempool = readLegacyJSON<Transaction[]>(
    "citycoins-stacks-acctMempoolTxs"
  );
  if (Array.isArray(legacyMempool)) {
    const current = get(acctMempoolTxsByAddressAtom);
    if (current[address] === undefined) {
      set(acctMempoolTxsByAddressAtom, { ...current, [address]: legacyMempool });
    }
  }

  // acctBalances (unknown)
  const legacyBalances = readLegacyJSON<unknown>("citycoins-stacks-acctBalances");
  if (legacyBalances !== undefined && legacyBalances !== null) {
    const current = get(acctBalancesByAddressAtom);
    if (current[address] === undefined) {
      set(acctBalancesByAddressAtom, { ...current, [address]: legacyBalances });
    }
  }

  // bnsName (string | null)
  const legacyBns = readLegacyJSON<string | null>("citycoins-stacks-bnsName");
  if (legacyBns !== undefined) {
    const current = get(bnsNameByAddressAtom);
    if (current[address] === undefined) {
      set(bnsNameByAddressAtom, { ...current, [address]: legacyBns });
    }
  }

  // userIds (UserIds | null)
  const legacyUserIds = readLegacyJSON<UserIds | null>("citycoins-user-ids");
  if (legacyUserIds !== undefined && legacyUserIds !== null) {
    const current = get(userIdsByAddressAtom);
    if (current[address] === undefined) {
      set(userIdsByAddressAtom, { ...current, [address]: legacyUserIds });
    }
  }

  // Remove legacy keys regardless of which fields migrated — anything left
  // would be re-fetched on demand under the new keys.
  for (const key of LEGACY_ACCOUNT_KEYS) {
    localStorage.removeItem(key);
  }
});

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
// BLOCK HEIGHT FETCH STATUS
/////////////////////////

export type BlockHeightFetchStatus = {
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
};

export const blockHeightFetchStatusAtom = atom<BlockHeightFetchStatus>({
  isLoading: false,
  error: null,
  lastFetched: null,
});

// Cache duration for block heights (30 seconds)
const BLOCK_HEIGHT_CACHE_DURATION = 30 * 1000;

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const blockHeightsQueryAtom = atom(async () => {
  return await getBlockHeights();
});

/**
 * Action atom to fetch block heights with deduplication.
 *
 * - Checks if a fetch is already in progress
 * - Checks if cached data is still fresh (within BLOCK_HEIGHT_CACHE_DURATION)
 * - Only fetches if needed
 */
export const fetchBlockHeightsAtom = atom(
  null,
  async (get, set) => {
    const status = get(blockHeightFetchStatusAtom);
    const existingHeights = get(blockHeightsAtom);

    // Skip if already loading (deduplication)
    if (status.isLoading) {
      return existingHeights;
    }

    // Skip if cache is still fresh
    const now = Date.now();
    if (
      status.lastFetched &&
      existingHeights &&
      now - status.lastFetched < BLOCK_HEIGHT_CACHE_DURATION
    ) {
      return existingHeights;
    }

    set(blockHeightFetchStatusAtom, {
      isLoading: true,
      error: null,
      lastFetched: status.lastFetched,
    });

    try {
      const blockHeights = await getBlockHeights();
      if (blockHeights) {
        set(blockHeightsAtom, blockHeights);
        set(blockHeightFetchStatusAtom, {
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        });
        return blockHeights;
      }
      throw new Error("Failed to fetch block heights");
    } catch (error) {
      set(blockHeightFetchStatusAtom, {
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
        lastFetched: status.lastFetched,
      });
      return existingHeights;
    }
  }
);

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

/**
 * Local sleep helper for exponential backoff on consecutive errors.
 * Note: Normal request spacing is handled by hiroFetch queue.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAllTxs(
  address: string,
  existingTxs: Transaction[],
  atomGetter: Getter,
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

  // Add existing transactions to map (slimming any legacy fat entries).
  for (const tx of existingTxs) {
    if (tx?.tx_id) txMap.set(tx.tx_id, toStoredTx(tx));
  }
  const existingCount = txMap.size;

  // Helper to get array from map and save
  const getTransactions = () => Array.from(txMap.values());
  const saveProgress = () => {
    const txs = getTransactions();
    const compressedTxs = LZString.compress(JSON.stringify(txs));

    // Check storage before saving - calculate delta vs existing data for this
    // address's slice of the per-address record. Other addresses' bytes are
    // untouched, so they don't contribute to the write delta.
    const newSize = getStringByteSize(compressedTxs);
    const existingForAddress =
      atomGetter(acctTxsByAddressAtom)[address] || "";
    const existingSize = getStringByteSize(existingForAddress);
    const deltaSize = newSize - existingSize; // Can be negative if shrinking
    const storageCheck = canSaveData(Math.max(0, deltaSize));

    // Emit warning at warning/critical levels
    if (storageCheck.level === "warning" || storageCheck.level === "critical") {
      emitStorageWarning(storageCheck.level, storageCheck.info);
    }

    // Skip save if quota would be exceeded
    if (!storageCheck.ok) {
      console.warn(
        `Storage quota exceeded. Cannot save ${txs.length} transactions.`
      );
      emitStorageWarning("exceeded", storageCheck.info);
      return;
    }

    // Attempt save with graceful error handling
    try {
      atomSetter(acctTxsAtom, compressedTxs);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        console.warn("localStorage quota exceeded during save");
        emitStorageWarning("exceeded", getStorageInfo());
      } else {
        // Re-throw non-quota errors
        throw error;
      }
    }
  };

  try {
    // Get initial response for transaction total
    // hiroFetch handles rate limiting via header-aware queue
    const initialResult = await hiroFetch<AddressTransactionsListResponse>(
      `${endpoint}?limit=${limit}`
    );
    if (!initialResult.ok || !initialResult.data) {
      throw new Error(initialResult.error || "Failed to fetch initial transactions");
    }
    const initialResponse = initialResult.data;
    totalTransactions = initialResponse.total;

    // Return if all transactions are already loaded, but keep the Map result so
    // older cached arrays with duplicate tx IDs get compacted on refresh.
    if (existingCount >= totalTransactions) {
      if (existingTxs.length !== existingCount) {
        saveProgress();
      }
      return getTransactions();
    }

    // Process initial fetch - v1 returns transactions directly in results
    const newTransactions = initialResponse.results as Transaction[];

    for (const tx of newTransactions) {
      if (tx?.tx_id && !txMap.has(tx.tx_id)) {
        txMap.set(tx.tx_id, toStoredTx(tx));
      }
    }

    // Update progress
    atomSetter(transactionFetchStatusAtom, (prev) => ({
      ...prev,
      progress: Math.round(limit / totalTransactions * 100),
    }));

    // Save after initial fetch
    saveProgress();

    // Return if we've fetched everything or API returned less than limit
    if (newTransactions.length < limit || limit >= totalTransactions) {
      return getTransactions();
    }

    // Loop to fetch remaining transactions
    // No manual sleep needed - hiroFetch queue handles rate limiting
    while (offset + limit < totalTransactions) {
      offset += limit;

      // hiroFetch handles rate limiting via header-aware queue
      const result = await hiroFetch<AddressTransactionsListResponse>(
        `${endpoint}?limit=${limit}&offset=${offset}`
      );

      if (!result.ok || !result.data) {
        // Treat as fetch error for retry logic
        consecutiveErrors++;
        saveProgress();

        if (consecutiveErrors >= maxConsecutiveErrors) {
          return getTransactions();
        }

        // Exponential backoff: 5s, 10s, 20s
        const backoffTime = 5000 * Math.pow(2, consecutiveErrors - 1);
        await sleep(backoffTime);
        offset -= limit; // Retry same offset
        continue;
      }

      consecutiveErrors = 0; // Reset on success

      // v1 returns transactions directly in results
      const additionalTransactions = result.data.results as Transaction[];

      // Add unique transactions to map (slimmed before storage)
      for (const tx of additionalTransactions) {
        if (tx?.tx_id && !txMap.has(tx.tx_id)) {
          txMap.set(tx.tx_id, toStoredTx(tx));
        }
      }

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
        break;
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
