/**
 * Broadcast Sync Hook
 *
 * Initializes cross-tab synchronization for verification cache.
 * When a user verifies claims in one tab, other tabs will receive
 * the results and update automatically.
 *
 * Mount this hook once in the app layout to enable sync.
 */

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import {
  initBroadcastSyncAtom,
  cleanupBroadcastSyncAtom,
} from "../store/verification";

/**
 * Hook that initializes and manages cross-tab synchronization.
 *
 * - On mount: Subscribes to BroadcastChannel for incoming messages
 * - On unmount: Cleans up the subscription
 *
 * Messages from other tabs are automatically merged into the
 * verification cache using a "newer wins" timestamp strategy.
 */
export function useBroadcastSync() {
  const initBroadcastSync = useSetAtom(initBroadcastSyncAtom);
  const cleanupBroadcastSync = useSetAtom(cleanupBroadcastSyncAtom);

  useEffect(() => {
    // Initialize broadcast sync
    initBroadcastSync();

    // Cleanup on unmount
    return () => {
      cleanupBroadcastSync();
    };
  }, [initBroadcastSync, cleanupBroadcastSync]);
}
