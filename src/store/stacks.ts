import { atomWithStorage } from "jotai/utils";
import { fetchCoreApiInfo } from "micro-stacks/api";
import {
  AddressTransactionsWithTransfersListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API, fancyFetch, sleep } from "./common";
import { atom } from "jotai";

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

export const acctTxsAtom = atomWithStorage<Transaction[]>(
  "citycoins-stacks-acctTxs",
  []
);

export const acctMempoolTxsAtom = atomWithStorage<Transaction[]>(
  "citycoins-stacks-acctMempoolTxs",
  []
);

export const acctBalancesAtom = atomWithStorage(
  "citycoins-stacks-acctBalances",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const transactionsAtom = atom(
  // read from localstorage
  (get) => {
    const acctTxs = get(acctTxsAtom);
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
      const newTxs = await getAllTxs(address, update);
      console.log("fetch complete, setting acctTxsAtom");
      set(transactionFetchStatusAtom, {
        isLoading: false,
        error: null,
        progress: 100,
      });
      set(acctTxsAtom, newTxs);
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
  return await getBlockHeights();
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

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

async function getAllTxs(address: string, existingTxs: Transaction[]) {
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
      const additionalTransactions = response.results.map(
        (txRecord) => txRecord.tx
      );
      console.log(additionalTransactions.length, "additional transactions");
      const uniqueAdditionalTransactions = additionalTransactions.filter(
        (tx) =>
          !uniqueTransactions.some((knownTx) => knownTx?.tx_id === tx.tx_id)
      );
      console.log(
        uniqueAdditionalTransactions.length,
        "unique additional transactions"
      );
      uniqueTransactions.push(...uniqueAdditionalTransactions);
      console.log(uniqueTransactions.length, "total unique transactions");
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
