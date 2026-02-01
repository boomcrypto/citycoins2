/**
 * Cross-Tab Synchronization via BroadcastChannel
 *
 * Enables real-time synchronization of claims state across browser tabs.
 * When a user verifies claims or detects claim transactions in one tab,
 * other tabs are notified and update their state automatically.
 *
 * Features:
 * - Graceful degradation when BroadcastChannel is not supported
 * - Tab ID prevents echo (receiving own messages)
 * - Address filtering ensures messages are only processed for the correct wallet
 * - Timestamp-based "newer wins" merge strategy
 */

import type { VerificationResult } from "../store/verification";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Message types for cross-tab communication
 */
export type BroadcastMessageType = "VERIFICATION_UPDATE";

/**
 * Payload for verification update messages
 */
export interface VerificationUpdatePayload {
  /** Cache entries to merge (key -> result) */
  entries: Record<string, VerificationResult>;
}

/**
 * Base message structure for all broadcasts
 */
export interface BroadcastMessage<T = unknown> {
  /** Message type for routing */
  type: BroadcastMessageType;
  /** Stacks address this message applies to */
  address: string;
  /** Message payload */
  payload: T;
  /** Timestamp for ordering and debugging */
  timestamp: number;
  /** Unique tab identifier to prevent echo */
  tabId: string;
}

/**
 * Callback for received messages
 */
export type BroadcastCallback = (message: BroadcastMessage) => void;

/**
 * Unsubscribe function returned by subscribe
 */
export type Unsubscribe = () => void;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Channel name for CityCoins cross-tab sync */
export const CHANNEL_NAME = "citycoins-sync";

/** Generate a unique tab ID on module load */
const TAB_ID = generateTabId();

// =============================================================================
// CORE STATE
// =============================================================================

/** Singleton channel instance */
let channel: BroadcastChannel | null = null;

/** Registered callbacks for incoming messages */
const callbacks: Set<BroadcastCallback> = new Set();

/** Whether the channel has been initialized */
let isInitialized = false;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique tab identifier
 *
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
export function generateTabId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if BroadcastChannel API is supported
 */
export function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

/**
 * Get the current tab ID
 */
export function getTabId(): string {
  return TAB_ID;
}

// =============================================================================
// CHANNEL MANAGEMENT
// =============================================================================

/**
 * Initialize the broadcast channel
 *
 * Creates the channel if supported and sets up message handling.
 * Safe to call multiple times - will only initialize once.
 *
 * @returns true if channel was initialized, false if not supported
 */
export function initBroadcastChannel(): boolean {
  if (isInitialized) {
    return channel !== null;
  }

  isInitialized = true;

  if (!isBroadcastChannelSupported()) {
    console.debug("[broadcast-sync] BroadcastChannel not supported");
    return false;
  }

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleIncomingMessage;
    channel.onmessageerror = (event) => {
      console.error("[broadcast-sync] Message error:", event);
    };
    console.debug("[broadcast-sync] Channel initialized, tabId:", TAB_ID);
    return true;
  } catch (error) {
    console.error("[broadcast-sync] Failed to create channel:", error);
    channel = null;
    return false;
  }
}

/**
 * Close the broadcast channel
 *
 * Cleans up resources. Call when app is unmounting.
 */
export function closeBroadcastChannel(): void {
  if (channel) {
    channel.close();
    channel = null;
  }
  callbacks.clear();
  isInitialized = false;
  console.debug("[broadcast-sync] Channel closed");
}

/**
 * Handle incoming messages from other tabs
 */
function handleIncomingMessage(event: MessageEvent<BroadcastMessage>): void {
  const message = event.data;

  // Ignore messages from this tab (prevent echo)
  if (message.tabId === TAB_ID) {
    return;
  }

  console.debug(
    "[broadcast-sync] Received:",
    message.type,
    "from tab:",
    message.tabId.substring(0, 8)
  );

  // Notify all registered callbacks
  callbacks.forEach((callback) => {
    try {
      callback(message);
    } catch (error) {
      console.error("[broadcast-sync] Callback error:", error);
    }
  });
}

// =============================================================================
// MESSAGE SENDING
// =============================================================================

/**
 * Broadcast a verification update to other tabs
 *
 * Call this after verification cache updates to sync with other tabs.
 *
 * @param address - Stacks address the update applies to
 * @param entries - Verification entries to merge (key -> result)
 */
export function broadcastVerificationUpdate(
  address: string,
  entries: Record<string, VerificationResult>
): void {
  if (!channel) {
    return;
  }

  // Skip if no entries to broadcast
  if (Object.keys(entries).length === 0) {
    return;
  }

  const message: BroadcastMessage<VerificationUpdatePayload> = {
    type: "VERIFICATION_UPDATE",
    address,
    payload: { entries },
    timestamp: Date.now(),
    tabId: TAB_ID,
  };

  try {
    channel.postMessage(message);
    console.debug(
      "[broadcast-sync] Sent VERIFICATION_UPDATE:",
      Object.keys(entries).length,
      "entries"
    );
  } catch (error) {
    console.error("[broadcast-sync] Failed to send message:", error);
  }
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to broadcast messages
 *
 * Register a callback to receive messages from other tabs.
 * The callback will NOT be called for messages sent by this tab.
 *
 * @param callback - Function to call when messages are received
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToBroadcasts((message) => {
 *   if (message.type === 'VERIFICATION_UPDATE') {
 *     // Merge entries into local cache
 *   }
 * });
 *
 * // Later, when cleaning up:
 * unsubscribe();
 * ```
 */
export function subscribeToBroadcasts(callback: BroadcastCallback): Unsubscribe {
  // Initialize channel if not already done
  initBroadcastChannel();

  callbacks.add(callback);

  return () => {
    callbacks.delete(callback);
  };
}

// =============================================================================
// MERGE UTILITIES
// =============================================================================

/**
 * Merge incoming verification entries with existing cache
 *
 * Uses "newer wins" strategy based on verifiedAt timestamp.
 * This handles race conditions where two tabs verify the same entry.
 *
 * @param existing - Current cache entries
 * @param incoming - Entries received from broadcast
 * @returns Merged cache (may be same object if no changes)
 */
export function mergeVerificationEntries(
  existing: Record<string, VerificationResult>,
  incoming: Record<string, VerificationResult>
): Record<string, VerificationResult> {
  let hasChanges = false;
  const merged = { ...existing };

  for (const [key, incomingEntry] of Object.entries(incoming)) {
    const existingEntry = existing[key];

    // Accept incoming if:
    // 1. No existing entry
    // 2. Incoming is newer
    // 3. Incoming is same timestamp but has more definitive status
    const shouldAccept =
      !existingEntry ||
      incomingEntry.verifiedAt > existingEntry.verifiedAt ||
      (incomingEntry.verifiedAt === existingEntry.verifiedAt &&
        isMoreDefinitiveStatus(incomingEntry.status, existingEntry.status));

    if (shouldAccept) {
      merged[key] = incomingEntry;
      hasChanges = true;
    }
  }

  return hasChanges ? merged : existing;
}

/**
 * Determine if status A is more definitive than status B
 *
 * Status priority (most to least definitive):
 * 1. claimed (final state)
 * 2. claimable, not-won, no-reward (verified states)
 * 3. error (failed but attempted)
 * 4. verifying (in progress)
 * 5. unverified (not started)
 */
function isMoreDefinitiveStatus(a: string, b: string): boolean {
  const priority: Record<string, number> = {
    claimed: 5,
    claimable: 4,
    "not-won": 4,
    "no-reward": 4,
    error: 3,
    verifying: 2,
    unverified: 1,
  };

  return (priority[a] || 0) > (priority[b] || 0);
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for verification update messages
 */
export function isVerificationUpdateMessage(
  message: BroadcastMessage
): message is BroadcastMessage<VerificationUpdatePayload> {
  return (
    message.type === "VERIFICATION_UPDATE" &&
    typeof message.payload === "object" &&
    message.payload !== null &&
    "entries" in message.payload
  );
}
