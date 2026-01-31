/**
 * Storage Monitor Hook
 *
 * Monitors localStorage usage and shows toast notifications
 * when approaching the 5MB browser limit.
 *
 * Mount this hook once in the app layout to enable monitoring.
 */

import { useEffect, useRef } from "react";
import { toaster } from "../components/ui/toaster";
import {
  formatBytes,
  STORAGE_WARNING_EVENT,
  type StorageWarningEvent,
} from "../utilities/storage-monitor";

/**
 * Hook that listens for storage warning events and displays
 * appropriate toast notifications to the user.
 *
 * Warning (3MB): Show dismissible notification
 * Critical (4MB): Show persistent error notification
 * Exceeded (5MB): Show error notification with guidance
 */
export function useStorageMonitor() {
  // Track if we've already shown a warning to avoid spam
  const hasShownWarning = useRef(false);
  const hasShownCritical = useRef(false);

  useEffect(() => {
    const handleStorageWarning = (event: CustomEvent<StorageWarningEvent>) => {
      const { level, info } = event.detail;

      if (level === "warning" && !hasShownWarning.current) {
        hasShownWarning.current = true;
        toaster.create({
          title: "Storage space running low",
          description: `Using ${formatBytes(info.used)} of 5MB. Consider clearing cached data if you experience issues.`,
          type: "warning",
          duration: 10000,
        });
      } else if (level === "critical" && !hasShownCritical.current) {
        hasShownCritical.current = true;
        hasShownWarning.current = true; // Also suppress warning
        toaster.create({
          title: "Storage space critical",
          description: `Using ${formatBytes(info.used)} of 5MB. Clear cached data to continue saving transactions.`,
          type: "error",
          duration: null, // Keep visible until dismissed
        });
      } else if (level === "exceeded") {
        // Always show exceeded error
        toaster.create({
          title: "Storage limit reached",
          description:
            "Unable to save new data. Clear cached data from the settings menu to free up space.",
          type: "error",
          duration: null, // Keep visible until dismissed
        });
      }
    };

    // Add event listener
    window.addEventListener(
      STORAGE_WARNING_EVENT,
      handleStorageWarning as EventListener
    );

    // Cleanup on unmount
    return () => {
      window.removeEventListener(
        STORAGE_WARNING_EVENT,
        handleStorageWarning as EventListener
      );
    };
  }, []);
}
