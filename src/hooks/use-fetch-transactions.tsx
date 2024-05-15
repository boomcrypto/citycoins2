import { useCallback, useEffect, useRef } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import {
  AddressTransactionsWithTransfersListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API } from "../store/common";
import { fancyFetch } from "../store/common";
import { stxAddressAtom, acctTxsAtom } from "../store/stacks";

type FetchStatus = {
  progress: number;
  isLoading: boolean;
  error: string | null;
};

const fetchStatusAtom = atom<FetchStatus>({
  progress: 0,
  isLoading: true,
  error: null,
});

const isFetchingTransactionsAtom = atom(false);

export function useFetchTransactions() {
  const address = useAtomValue(stxAddressAtom);
  const [fetchStatus, setFetchStatus] = useAtom(fetchStatusAtom);
  const [existingTransactions, setExistingTransactions] = useAtom(acctTxsAtom);
  const existingTransactionsRef = useRef(existingTransactions);
  const [isFetchingTransactions, setIsFetchingTransactions] = useAtom(
    isFetchingTransactionsAtom
  );

  const fetchTransactions = useCallback(async () => {
    // check if we're already fetching
    if (isFetchingTransactions) {
      return;
    } else {
      setIsFetchingTransactions(true);
    }
    try {
      // setup info for fetching transactions
      const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
      const limit = 50;
      let offset = 0;
      let totalTransactions = 0;

      // fetch once to get total count
      console.log("fetch once to get total count");
      let url = new URL(endpoint);
      url.searchParams.set("limit", limit.toString());
      const initialResponse =
        await fancyFetch<AddressTransactionsWithTransfersListResponse>(
          url.toString()
        );
      totalTransactions = initialResponse.total;

      // check if we already have all transactions
      console.log("check if we already have all transactions");
      console.log("existing: ", existingTransactionsRef.current.length);
      console.log("total: ", totalTransactions);
      if (existingTransactionsRef.current.length === totalTransactions) {
        console.log("already have all transactions, done");
        setIsFetchingTransactions(false);
        setFetchStatus({ progress: 100, isLoading: false, error: null });
        return;
      }

      // get and store unique transactions from initial response
      console.log("get and store unique transactions from initial response");
      console.log("initial response: ", initialResponse.results);
      console.log("existing transactions: ", existingTransactionsRef.current);
      const uniqueTransactions = [
        ...existingTransactionsRef.current,
        ...initialResponse.results
          .filter(
            (apiTx) =>
              !existingTransactionsRef.current.some(
                (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
              )
          )
          .map((txRecord) => txRecord.tx)
          .filter((tx): tx is Transaction => tx !== null && tx !== undefined),
      ];
      console.log(uniqueTransactions.length, "unique transactions");
      console.log("unique transactions: ", uniqueTransactions);

      // set transactions, update ref and fetch status
      console.log("set transactions, update ref and fetch status");
      setExistingTransactions(uniqueTransactions);
      existingTransactionsRef.current = uniqueTransactions;
      setFetchStatus({
        progress: (uniqueTransactions.length / totalTransactions) * 100,
        isLoading: true,
        error: null,
      });
      console.log(
        "existingTransactionsRef.current: ",
        existingTransactionsRef.current
      );

      // function to fetch remaining transactions
      const fetchRemainingTransactions = async () => {
        console.log("fetching remaining transactions");
        while (existingTransactionsRef.current.length < totalTransactions) {
          console.log(
            existingTransactionsRef.current.length,
            "existing transactions"
          );
          console.log(totalTransactions, "total transactions");
          offset += limit;
          // break if offset > total
          if (offset > totalTransactions) {
            console.log("breaking because offset > totalTransactions");
            console.log("offset: ", offset);
            console.log("totalTransactions: ", totalTransactions);
            setFetchStatus({
              progress: 0,
              isLoading: false,
              error: "Failed to load transactions, offset exceeded total",
            });
            break;
          }
          url.searchParams.set("offset", offset.toString());
          const response =
            await fancyFetch<AddressTransactionsWithTransfersListResponse>(
              url.toString()
            );

          // get and store unique transactions from response
          console.log("get and store unique transactions from response");
          const newTransactions = [
            ...existingTransactionsRef.current,
            ...response.results
              .filter(
                (apiTx) =>
                  !existingTransactionsRef.current.some(
                    (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
                  )
              )
              .map((txRecord) => txRecord.tx)
              .filter(
                (tx): tx is Transaction => tx !== null && tx !== undefined
              ),
          ];
          console.log(newTransactions.length, "new transactions");

          // set transactions and fetch status
          console.log("set transactions and fetch status");
          setExistingTransactions(newTransactions);
          existingTransactionsRef.current = newTransactions;
          setFetchStatus({
            progress:
              (existingTransactionsRef.current.length / totalTransactions) *
              100,
            isLoading: true,
            error: null,
          });
          console.log(
            "existingTransactionsRef.current: ",
            existingTransactionsRef.current
          );
        }
      };
      // fetch remaining transactions in chunks
      console.log("fetch remaining transactions in chunks");
      await fetchRemainingTransactions();

      // update status when complete
      console.log("update status when complete");
      setFetchStatus({ progress: 100, isLoading: false, error: null });
    } catch (error) {
      console.log("caught an error: ", error);
      setIsFetchingTransactions(false);
      if (error instanceof Error) {
        setFetchStatus({
          progress: 0,
          isLoading: false,
          error: error.message,
        });
      } else {
        setFetchStatus({
          progress: 0,
          isLoading: false,
          error: `Unknown error: ${String(error)}`,
        });
      }
    }
  }, [
    address,
    isFetchingTransactions,
    setExistingTransactions,
    setFetchStatus,
    setIsFetchingTransactions,
  ]);
  const refreshTransactions = async () => {
    if (address && existingTransactionsRef.current.length > 0) {
      const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
      const response =
        await fancyFetch<AddressTransactionsWithTransfersListResponse>(
          endpoint
        );
      const totalTransactions = response.total;

      if (
        existingTransactionsRef.current.length < totalTransactions &&
        !isFetchingTransactions
      ) {
        fetchTransactions();
      }
    }
  };

  useEffect(() => {
    if (address && existingTransactionsRef.current.length === 0) {
      fetchTransactions();
    }
  }, [address, fetchTransactions]);

  return {
    ...fetchStatus,
    isLoading: isFetchingTransactions,
    refreshTransactions,
  };
}
