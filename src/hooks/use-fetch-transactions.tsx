import { useEffect } from "react";
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

  useEffect(() => {
    async function fetchTransactions() {
      try {
        // setup info for fetching transactions
        const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
        const limit = 50;
        let offset = 0;
        let totalTransactions = 0;

        // fetch once to get total count
        let url = new URL(endpoint);
        url.searchParams.set("limit", limit.toString());
        const initialResponse =
          await fancyFetch<AddressTransactionsWithTransfersListResponse>(
            url.toString()
          );
        totalTransactions = initialResponse.total;

        // check if we already have all transactions
        if (existingTransactions.length === totalTransactions) {
          setFetchStatus({ progress: 100, isLoading: false, error: null });
          return;
        }

        // get and store unique transactions from initial response
        const uniqueTransactions = [
          ...existingTransactions,
          ...initialResponse.results
            .filter(
              (apiTx) =>
                !existingTransactions.some(
                  (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
                )
            )
            .map((txRecord) => txRecord.tx),
        ];

        // set transactions and fetch status
        setExistingTransactions(uniqueTransactions);
        setFetchStatus({
          progress: (existingTransactions.length / totalTransactions) * 100,
          isLoading: true,
          error: null,
        });

        // fetch remaining transactions
        while (existingTransactions.length < totalTransactions) {
          offset += limit;
          url.searchParams.set("offset", offset.toString());
          const response =
            await fancyFetch<AddressTransactionsWithTransfersListResponse>(
              url.toString()
            );

          // get and store unique transactions from response
          const fetchedTransactions = [
            ...existingTransactions,
            ...response.results
              .filter(
                (apiTx) =>
                  !existingTransactions.some(
                    (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
                  )
              )
              .map((txRecord) => txRecord.tx),
          ];

          // set transactions and fetch status
          setExistingTransactions(fetchedTransactions);
          setFetchStatus({
            progress: (fetchedTransactions.length / totalTransactions) * 100,
            isLoading: true,
            error: null,
          });
        }
        // update status when complete
        setFetchStatus((prev) => ({ ...prev, isLoading: false }));
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
    }

    if (address) {
      fetchTransactions();
    }
  }, [address, existingTransactions, setExistingTransactions, setFetchStatus]);

  return fetchStatus;
}
