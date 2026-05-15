import { Flex, Separator } from "@chakra-ui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { stxAddressAtom } from "./store/stacks";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";
import Header from "./components/layout/page-header";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { useStorageMonitor } from "./hooks/use-storage-monitor";
import { useBroadcastSync } from "./hooks/use-broadcast-sync";
import {
  migrateAccountAtomsByAddressAtom,
  migrateStoredTxsAtom,
} from "./store/stacks";
import { migrateVerificationCacheAtom } from "./store/verification";
import { migratePendingClaimsByAddressAtom } from "./store/claims";

/**
 * Inner app content with storage monitoring and cross-tab sync
 */
const AppContent = () => {
  // Monitor localStorage usage and show warnings
  useStorageMonitor();

  // Enable cross-tab synchronization for verification cache
  useBroadcastSync();

  // One-shot migrations. Each is a no-op when nothing needs migrating:
  //   - migrateAccountAtomsByAddress: move legacy single-key per-account
  //     caches (acctTxs, userIds, bnsName, mempool, balances) into the new
  //     address-keyed records under the connected wallet. Requires a
  //     connected wallet to know which slice to assign the legacy data to,
  //     so it also re-runs when stxAddress later becomes available (e.g.
  //     user lands on the app signed out, then connects).
  //   - migrateStoredTxs: slim legacy fat transactions in the cached blob.
  //   - migrateVerificationCache: rewrite legacy "unpaid" entries to
  //     "no-payout".
  //   - migratePendingClaimsByAddress: reshape the flat pending-claims array
  //     into a per-address record.
  // Order matters: per-address migration must run before migrateStoredTxs,
  // since the latter reads via the new address-scoped acctTxs atom.
  const stxAddress = useAtomValue(stxAddressAtom);
  const migrateAccountAtomsByAddress = useSetAtom(migrateAccountAtomsByAddressAtom);
  const migrateStoredTxs = useSetAtom(migrateStoredTxsAtom);
  const migrateVerificationCache = useSetAtom(migrateVerificationCacheAtom);
  const migratePendingClaimsByAddress = useSetAtom(migratePendingClaimsByAddressAtom);
  useEffect(() => {
    migrateAccountAtomsByAddress();
    migrateStoredTxs();
    migrateVerificationCache();
    migratePendingClaimsByAddress();
  }, [
    stxAddress,
    migrateAccountAtomsByAddress,
    migrateStoredTxs,
    migrateVerificationCache,
    migratePendingClaimsByAddress,
  ]);

  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Separator />
      <Flex
        flex="1"
        alignItems="flex-start"
        justifyContent="center"
        my={16}
        mx={[2, 8]}
      >
        <Content />
      </Flex>
      <Separator />
      <Footer />
    </Flex>
  );
};

export const App = () => {
  return (
    <Provider>
      <AppContent />
      <Toaster />
    </Provider>
  );
};
