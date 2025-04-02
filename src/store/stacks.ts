import { atomWithStorage } from "jotai/utils";
import { fetchCoreApiInfo, ReadOnlyFunctionOptions } from "micro-stacks/api";
import {
  AddressTransactionsWithTransfersListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API, fancyFetch, sleep } from "./common";
import { Setter, atom } from "jotai";
import LZString from "lz-string";
import { ClarityValue } from "micro-stacks/clarity";

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

export const stacksLocalStorageAtoms = [
  blockHeightsAtom,
  stxAddressAtom,
  bnsNameAtom,
  acctTxsAtom,
  acctMempoolTxsAtom,
  acctBalancesAtom,
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
  return await getCachedBlockHeights();
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// create a type for this output
//{"success":true,"data":{"success":true,"data":"{\"server_version\":\"stacks-blockchain-api v8.8.0-beta.2 (beta:c398dd68b)\",\"status\":\"ready\",\"pox_v1_unlock_height\":781552,\"pox_v2_unlock_height\":787652,\"pox_v3_unlock_height\":840361,\"chain_tip\":{\"block_height\":888365,\"block_hash\":\"0x14ebfeb3502f4baa102d0ba398592fd82514267d9c5cb7ad214a98065d80962e\",\"index_block_hash\":\"0xba656cab9c9e300420ef8ec6465682af97d9a33efe5e26c10cfbf53153c09df2\",\"burn_block_height\":890500}}"}}
type HiroExtendedInfoResponse = {
  success: boolean;
  data: {
    server_version: string;
    status: string;
    pox_v1_unlock_height: number;
    pox_v2_unlock_height: number;
    pox_v3_unlock_height: number;
    chain_tip: {
      block_height: number;
      block_hash: string;
      index_block_hash: string;
      burn_block_height: number;
    };
  };
};

async function getCachedBlockHeights(): Promise<BlockHeights | undefined> {
  const url = "https://cache.aibtc.dev/hiro-api/extended";
  const response = await fetch(url);
  if (!response.ok) {
    return undefined;
  }
  const data = (await response.json()) as HiroExtendedInfoResponse;
  if (!data.success) {
    return undefined;
  }
  const blockHeights: BlockHeights = {
    btc: data.data.chain_tip.burn_block_height,
    stx: data.data.chain_tip.block_height,
  };
  return blockHeights;
}

export const CACHE_BASE_URL = "https://cache.aibtc.dev";
export const CACHE_READ_ONLY_URL = `${CACHE_BASE_URL}/contract-calls/read-only`;
export const CACHE_INIT_OBJ = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

export type CacheRequest = {
  functionArgs: ClarityValue[];
  network: string;
  senderAddress?: string;
  cacheControl?: CacheControlOptions;
};

export type CacheControlOptions = {
  bustCache?: boolean;
  skipCache?: boolean;
  ttl?: number;
};

export type CacheResponse = {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: any;
    id?: string;
  };
};

export type CacheFunctionOptions = ReadOnlyFunctionOptions & {
  cacheControl?: CacheControlOptions;
  functionArgs: ClarityValue[];
  network?: string;
};

export async function fetchReadOnlyFunctionCached(
  options: CacheFunctionOptions
): Promise<CacheResponse> {
  const {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network,
    senderAddress,
    cacheControl,
  } = options;
  const url = `${CACHE_READ_ONLY_URL}/${contractAddress}/${contractName}/${functionName}`;
  const requestBody: CacheRequest = {
    functionArgs,
    network: network || "mainnet",
    senderAddress,
    cacheControl,
  };
  const response = await fetch(url, {
    ...CACHE_INIT_OBJ,
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch read-only function: ${response.status}`);
  }
  const data = (await response.json()) as CacheResponse;
  if (!data.success) {
    throw new Error(`Failed to fetch read-only function: ${data.error}`);
  }
  return data;
}
async function getBlockHeights(): Promise<BlockHeights | undefined> {
  try {
    const v2InfoResponse = await fetchCoreApiInfo({
      url: `${HIRO_API}/v2/info`,
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
