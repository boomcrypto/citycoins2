import { useCallback, useEffect } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import {
  AddressTransactionsWithTransfersListResponse,
  Transaction,
} from "@stacks/stacks-blockchain-api-types";
import { HIRO_API } from "../store/common";
import { fancyFetch } from "../store/common";
import { stxAddressAtom, acctTxsAtom } from "../store/stacks";

type FetchStatus = {
  isLoading: boolean;
  error: string | null;
  progress: number;
};

const fetchStatusAtom = atom<FetchStatus>({
  isLoading: false,
  error: null,
  progress: 0,
});

export function useFetchTransactions() {
  const address = useAtomValue(stxAddressAtom);
  const [fetchStatus, setFetchStatus] = useAtom(fetchStatusAtom);
  const [existingTransactions, setExistingTransactions] = useAtom(acctTxsAtom);

  const fetchTransactions = useCallback(async () => {
    if (fetchStatus.isLoading || !address) return;

    setFetchStatus({ isLoading: true, error: null, progress: 0 });

    try {
      const endpoint = `${HIRO_API}/extended/v1/address/${address}/transactions`;
      const limit = 50;
      let offset = 0;
      let totalTransactions = 0;

      const initialResponse =
        await fancyFetch<AddressTransactionsWithTransfersListResponse>(
          `${endpoint}?limit=${limit}`
        );
      totalTransactions = initialResponse.total;

      if (existingTransactions.length === totalTransactions) {
        setFetchStatus({ isLoading: false, error: null, progress: 100 });
        return;
      }

      const newTransactions = initialResponse.results
        .filter(
          (apiTx) =>
            !existingTransactions.some(
              (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
            )
        )
        .map((txRecord) => txRecord.tx)
        .filter((tx): tx is Transaction => tx !== null && tx !== undefined);

      setExistingTransactions([...existingTransactions, ...newTransactions]);
      setFetchStatus({
        isLoading: true,
        error: null,
        progress: Math.min(
          ((existingTransactions.length + newTransactions.length) /
            totalTransactions) *
            100,
          100
        ),
      });

      while (
        existingTransactions.length + newTransactions.length <
        totalTransactions
      ) {
        offset += limit;
        const response =
          await fancyFetch<AddressTransactionsWithTransfersListResponse>(
            `${endpoint}?limit=${limit}&offset=${offset}`
          );

        const additionalTransactions = response.results
          .filter(
            (apiTx) =>
              !existingTransactions.some(
                (knownTx) => knownTx.tx_id === apiTx.tx.tx_id
              ) &&
              !newTransactions.some((newTx) => newTx.tx_id === apiTx.tx.tx_id)
          )
          .map((txRecord) => txRecord.tx)
          .filter((tx): tx is Transaction => tx !== null && tx !== undefined);

        setExistingTransactions([
          ...existingTransactions,
          ...newTransactions,
          ...additionalTransactions,
        ]);
        newTransactions.push(...additionalTransactions);
        setFetchStatus({
          isLoading: true,
          error: null,
          progress: Math.min(
            ((existingTransactions.length +
              newTransactions.length +
              additionalTransactions.length) /
              totalTransactions) *
              100,
            100
          ),
        });
      }

      setFetchStatus({ isLoading: false, error: null, progress: 100 });
    } catch (error) {
      if (error instanceof Error) {
        setFetchStatus({ isLoading: false, error: error.message, progress: 0 });
      } else {
        setFetchStatus({
          isLoading: false,
          error: `Unknown error: ${String(error)}`,
          progress: 0,
        });
      }
    }
  }, [
    address,
    existingTransactions,
    fetchStatus.isLoading,
    setExistingTransactions,
    setFetchStatus,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { ...fetchStatus, refreshTransactions: fetchTransactions };
}
