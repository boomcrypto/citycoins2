import { useCallback } from "react";
import { PrimitiveAtom, WritableAtom } from "jotai";
import { RESET, useAtomCallback } from "jotai/utils";
import { activeTabAtom } from "../store/common";
import { ccip016LocalStorageAtoms } from "../store/ccip-016";
import {
  blockHeightsAtom,
  perAddressStorageAtoms,
  stxAddressAtom,
} from "../store/stacks";
import {
  pendingClaimTransactionsByAddressAtom,
  PendingClaimTransaction,
} from "../store/claims";
import {
  verificationCacheByAddressAtom,
  VerificationResult,
} from "../store/verification";

type AnyWritableAtom = WritableAtom<any, any, any>;

/**
 * Clears the connected wallet's data:
 *   - per-address atoms (txs, mempool, balances, user IDs, BNS name,
 *     pending claims, verification cache) have just the current address's
 *     slice removed, leaving other accounts' caches intact.
 *   - global non-account atoms (active tab, block heights, CCIP-016 state)
 *     are reset to defaults — these don't belong to any one wallet.
 *   - stxAddress is cleared last so writes above route to the right slice.
 */
export const useClearUserData = () => {
  const clearData = useAtomCallback(
    useCallback((get, set) => {
      const address = get(stxAddressAtom);

      if (address) {
        // Remove only this wallet's slice from each per-address record so
        // re-connecting another wallet keeps its own cache.
        for (const byAddressAtom of perAddressStorageAtoms) {
          const typed = byAddressAtom as PrimitiveAtom<Record<string, unknown>>;
          const current = get(typed);
          if (current && address in current) {
            const next = { ...current };
            delete next[address];
            set(typed, next);
          }
        }

        const pendingClaims = get(pendingClaimTransactionsByAddressAtom);
        if (address in pendingClaims) {
          const next: Record<string, PendingClaimTransaction[]> = {
            ...pendingClaims,
          };
          delete next[address];
          set(pendingClaimTransactionsByAddressAtom, next);
        }

        const verificationCache = get(verificationCacheByAddressAtom);
        if (address in verificationCache) {
          const next: Record<string, Record<string, VerificationResult>> = {
            ...verificationCache,
          };
          delete next[address];
          set(verificationCacheByAddressAtom, next);
        }
      }

      // Global, non-account atoms — reset to defaults.
      const globalAtoms: AnyWritableAtom[] = [
        activeTabAtom,
        blockHeightsAtom,
        ...ccip016LocalStorageAtoms,
      ];
      for (const atom of globalAtoms) {
        set(atom, RESET);
      }

      // Clear identity last; any address-scoped writes above need it.
      set(stxAddressAtom, RESET);
    }, [])
  );

  return clearData;
};
