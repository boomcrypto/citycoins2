import { Flex, Separator } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";
import Header from "./components/layout/page-header";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { useStorageMonitor } from "./hooks/use-storage-monitor";
import { useBroadcastSync } from "./hooks/use-broadcast-sync";
import { migrateStoredTxsAtom } from "./store/stacks";
import { migrateVerificationCacheAtom } from "./store/verification";

/**
 * Inner app content with storage monitoring and cross-tab sync
 */
const AppContent = () => {
  // Monitor localStorage usage and show warnings
  useStorageMonitor();

  // Enable cross-tab synchronization for verification cache
  useBroadcastSync();

  // One-shot migrations: slim legacy transaction cache and rewrite any
  // legacy "unpaid" verification entries to "no-payout". Both are no-ops
  // when nothing needs migrating.
  const migrateStoredTxs = useSetAtom(migrateStoredTxsAtom);
  const migrateVerificationCache = useSetAtom(migrateVerificationCacheAtom);
  useEffect(() => {
    migrateStoredTxs();
    migrateVerificationCache();
  }, [migrateStoredTxs, migrateVerificationCache]);

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
