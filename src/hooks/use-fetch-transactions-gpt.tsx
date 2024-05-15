import { useEffect, useRef, useCallback } from "react";
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

export function useFetchTransactions() {
  const address = useAtomValue(stxAddressAtom);
  const [fetchStatus, setFetchStatus] = useAtom(fetchStatusAtom);
  const [existingTransactions, setExistingTransactions] = useAtom(acctTxsAtom);
  const existingTransactionsRef = useRef(existingTransactions);
  const hasFetchedRef = useRef(false); // Ref to track if fetch has run

  const fetchTransactions = useCallback(async () => {
    if (!address || hasFetchedRef.current) return;

    try {
      const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
      const limit = 50;
      let offset = 0;
      let totalTransactions = 0;

      let url = new URL(endpoint);
      url.searchParams.set("limit", limit.toString());
      const initialResponse =
        await fancyFetch<AddressTransactionsWithTransfersListResponse>(
          url.toString()
        );
      totalTransactions = initialResponse.total;

      if (existingTransactionsRef.current.length === totalTransactions) {
        setFetchStatus({ progress: 100, isLoading: false, error: null });
        hasFetchedRef.current = true;
        return;
      }

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

      setExistingTransactions(uniqueTransactions);
      existingTransactionsRef.current = uniqueTransactions;
      setFetchStatus({
        progress: (uniqueTransactions.length / totalTransactions) * 100,
        isLoading: true,
        error: null,
      });

      const fetchRemainingTransactions = async () => {
        while (existingTransactionsRef.current.length < totalTransactions) {
          offset += limit;
          if (offset > totalTransactions) {
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

          setExistingTransactions(newTransactions);
          existingTransactionsRef.current = newTransactions;
          setFetchStatus({
            progress:
              (existingTransactionsRef.current.length / totalTransactions) *
              100,
            isLoading: true,
            error: null,
          });
        }
      };

      await fetchRemainingTransactions();
      setFetchStatus({ progress: 100, isLoading: false, error: null });
      hasFetchedRef.current = true; // Mark fetch as completed
    } catch (error) {
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
  }, [address, setFetchStatus, setExistingTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refreshTransactions = () => {
    hasFetchedRef.current = false; // Reset fetch tracker
    setFetchStatus({ progress: 0, isLoading: true, error: null });
    setExistingTransactions([]);
    existingTransactionsRef.current = [];
    fetchTransactions();
  };

  return { fetchStatus, refreshTransactions };
}
