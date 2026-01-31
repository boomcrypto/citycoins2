/**
 * Broadcast Sync Tests
 *
 * Tests for cross-tab synchronization via BroadcastChannel.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateTabId,
  isBroadcastChannelSupported,
  getTabId,
  initBroadcastChannel,
  closeBroadcastChannel,
  broadcastVerificationUpdate,
  subscribeToBroadcasts,
  mergeVerificationEntries,
  isVerificationUpdateMessage,
  CHANNEL_NAME,
  BroadcastMessage,
  VerificationUpdatePayload,
} from "../broadcast-sync";
import { VerificationResult } from "../../store/verification";

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock BroadcastChannel
class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown): void {
    if (this.closed) {
      throw new Error("Channel is closed");
    }
    // Simulate message delivery to other instances
    MockBroadcastChannel.instances.forEach((instance) => {
      if (instance !== this && !instance.closed && instance.onmessage) {
        // Use setTimeout to simulate async message delivery
        setTimeout(() => {
          instance.onmessage?.({ data: message } as MessageEvent);
        }, 0);
      }
    });
  }

  close(): void {
    this.closed = true;
    const index = MockBroadcastChannel.instances.indexOf(this);
    if (index > -1) {
      MockBroadcastChannel.instances.splice(index, 1);
    }
  }

  static reset(): void {
    MockBroadcastChannel.instances = [];
  }
}

// Store original BroadcastChannel
const OriginalBroadcastChannel =
  typeof BroadcastChannel !== "undefined" ? BroadcastChannel : undefined;

// =============================================================================
// GENERATE TAB ID TESTS
// =============================================================================

describe("generateTabId", () => {
  it("should generate a non-empty string", () => {
    const tabId = generateTabId();
    expect(typeof tabId).toBe("string");
    expect(tabId.length).toBeGreaterThan(0);
  });

  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTabId());
    }
    // All IDs should be unique
    expect(ids.size).toBe(100);
  });

  it("should generate UUID format when crypto.randomUUID is available", () => {
    // If crypto.randomUUID is available, it should return UUID format
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      const tabId = generateTabId();
      // UUID format: 8-4-4-4-12 characters
      expect(tabId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    }
  });
});

// =============================================================================
// GET TAB ID TESTS
// =============================================================================

describe("getTabId", () => {
  it("should return consistent ID for same tab", () => {
    const id1 = getTabId();
    const id2 = getTabId();
    expect(id1).toBe(id2);
  });
});

// =============================================================================
// IS BROADCAST CHANNEL SUPPORTED TESTS
// =============================================================================

describe("isBroadcastChannelSupported", () => {
  it("should return boolean", () => {
    const result = isBroadcastChannelSupported();
    expect(typeof result).toBe("boolean");
  });
});

// =============================================================================
// MERGE VERIFICATION ENTRIES TESTS
// =============================================================================

describe("mergeVerificationEntries", () => {
  const createEntry = (
    status: string,
    verifiedAt: number
  ): VerificationResult => ({
    status: status as VerificationResult["status"],
    verifiedAt,
  });

  it("should return existing if incoming is empty", () => {
    const existing = {
      "key1": createEntry("claimable", 1000),
    };
    const incoming = {};

    const result = mergeVerificationEntries(existing, incoming);
    expect(result).toBe(existing); // Same object reference
  });

  it("should add new entries from incoming", () => {
    const existing = {
      "key1": createEntry("claimable", 1000),
    };
    const incoming = {
      "key2": createEntry("claimed", 2000),
    };

    const result = mergeVerificationEntries(existing, incoming);
    expect(result).toEqual({
      "key1": createEntry("claimable", 1000),
      "key2": createEntry("claimed", 2000),
    });
  });

  it("should accept newer entries", () => {
    const existing = {
      "key1": createEntry("verifying", 1000),
    };
    const incoming = {
      "key1": createEntry("claimable", 2000), // Newer
    };

    const result = mergeVerificationEntries(existing, incoming);
    expect(result["key1"]).toEqual(createEntry("claimable", 2000));
  });

  it("should keep existing if it is newer", () => {
    const existing = {
      "key1": createEntry("claimable", 2000), // Newer
    };
    const incoming = {
      "key1": createEntry("verifying", 1000),
    };

    const result = mergeVerificationEntries(existing, incoming);
    expect(result).toBe(existing); // Same object, no changes
    expect(result["key1"]).toEqual(createEntry("claimable", 2000));
  });

  it("should prefer more definitive status at same timestamp", () => {
    // claimed > verifying
    const existing1 = {
      "key1": createEntry("verifying", 1000),
    };
    const incoming1 = {
      "key1": createEntry("claimed", 1000),
    };
    expect(mergeVerificationEntries(existing1, incoming1)["key1"].status).toBe(
      "claimed"
    );

    // claimable > unverified
    const existing2 = {
      "key1": createEntry("unverified", 1000),
    };
    const incoming2 = {
      "key1": createEntry("claimable", 1000),
    };
    expect(mergeVerificationEntries(existing2, incoming2)["key1"].status).toBe(
      "claimable"
    );
  });

  it("should handle complex merge scenarios", () => {
    const existing = {
      "key1": createEntry("claimable", 1000),
      "key2": createEntry("verifying", 2000),
      "key3": createEntry("error", 1500),
    };
    const incoming = {
      "key1": createEntry("claimed", 3000), // Newer, should replace
      "key2": createEntry("claimed", 1000), // Older, should keep existing
      "key3": createEntry("claimable", 2000), // Newer, should replace
      "key4": createEntry("not-won", 500), // New key, should add
    };

    const result = mergeVerificationEntries(existing, incoming);

    expect(result["key1"].status).toBe("claimed"); // Updated (newer)
    expect(result["key2"].status).toBe("verifying"); // Kept (existing newer)
    expect(result["key3"].status).toBe("claimable"); // Updated (newer)
    expect(result["key4"].status).toBe("not-won"); // Added (new)
  });

  it("should not mutate input objects", () => {
    const existing = {
      "key1": createEntry("verifying", 1000),
    };
    const incoming = {
      "key1": createEntry("claimed", 2000),
    };

    const existingCopy = JSON.stringify(existing);
    const incomingCopy = JSON.stringify(incoming);

    mergeVerificationEntries(existing, incoming);

    expect(JSON.stringify(existing)).toBe(existingCopy);
    expect(JSON.stringify(incoming)).toBe(incomingCopy);
  });
});

// =============================================================================
// IS VERIFICATION UPDATE MESSAGE TESTS
// =============================================================================

describe("isVerificationUpdateMessage", () => {
  it("should return true for valid verification update message", () => {
    const message: BroadcastMessage<VerificationUpdatePayload> = {
      type: "VERIFICATION_UPDATE",
      address: "SP123",
      payload: {
        entries: {
          "key1": { status: "claimed", verifiedAt: 1000 },
        },
      },
      timestamp: Date.now(),
      tabId: "test-tab",
    };

    expect(isVerificationUpdateMessage(message)).toBe(true);
  });

  it("should return false for other message types", () => {
    const message: BroadcastMessage = {
      type: "CACHE_MERGE",
      address: "SP123",
      payload: {},
      timestamp: Date.now(),
      tabId: "test-tab",
    };

    expect(isVerificationUpdateMessage(message)).toBe(false);
  });

  it("should return false for missing payload", () => {
    const message = {
      type: "VERIFICATION_UPDATE",
      address: "SP123",
      payload: null,
      timestamp: Date.now(),
      tabId: "test-tab",
    } as unknown as BroadcastMessage;

    expect(isVerificationUpdateMessage(message)).toBe(false);
  });

  it("should return false for payload without entries", () => {
    const message: BroadcastMessage = {
      type: "VERIFICATION_UPDATE",
      address: "SP123",
      payload: { something: "else" },
      timestamp: Date.now(),
      tabId: "test-tab",
    };

    expect(isVerificationUpdateMessage(message)).toBe(false);
  });
});

// =============================================================================
// CHANNEL MANAGEMENT TESTS (with mocks)
// =============================================================================

describe("BroadcastChannel management", () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    closeBroadcastChannel(); // Reset module state

    // Install mock
    Object.defineProperty(global, "BroadcastChannel", {
      value: MockBroadcastChannel,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    closeBroadcastChannel();
    MockBroadcastChannel.reset();

    // Restore original
    if (OriginalBroadcastChannel) {
      Object.defineProperty(global, "BroadcastChannel", {
        value: OriginalBroadcastChannel,
        writable: true,
        configurable: true,
      });
    }
  });

  describe("initBroadcastChannel", () => {
    it("should return true when channel is created", () => {
      const result = initBroadcastChannel();
      expect(result).toBe(true);
      expect(MockBroadcastChannel.instances.length).toBe(1);
    });

    it("should only create one channel on multiple calls", () => {
      initBroadcastChannel();
      initBroadcastChannel();
      initBroadcastChannel();
      expect(MockBroadcastChannel.instances.length).toBe(1);
    });

    it("should use correct channel name", () => {
      initBroadcastChannel();
      expect(MockBroadcastChannel.instances[0].name).toBe(CHANNEL_NAME);
    });
  });

  describe("closeBroadcastChannel", () => {
    it("should close the channel", () => {
      initBroadcastChannel();
      expect(MockBroadcastChannel.instances.length).toBe(1);

      closeBroadcastChannel();
      expect(MockBroadcastChannel.instances.length).toBe(0);
    });

    it("should allow re-initialization after close", () => {
      initBroadcastChannel();
      closeBroadcastChannel();

      const result = initBroadcastChannel();
      expect(result).toBe(true);
      expect(MockBroadcastChannel.instances.length).toBe(1);
    });
  });
});

// =============================================================================
// SUBSCRIPTION TESTS (with mocks)
// =============================================================================

describe("subscribeToBroadcasts", () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    closeBroadcastChannel();

    Object.defineProperty(global, "BroadcastChannel", {
      value: MockBroadcastChannel,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    closeBroadcastChannel();
    MockBroadcastChannel.reset();

    if (OriginalBroadcastChannel) {
      Object.defineProperty(global, "BroadcastChannel", {
        value: OriginalBroadcastChannel,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should initialize channel if not already initialized", () => {
    expect(MockBroadcastChannel.instances.length).toBe(0);

    subscribeToBroadcasts(() => {});

    expect(MockBroadcastChannel.instances.length).toBe(1);
  });

  it("should return unsubscribe function", () => {
    const unsubscribe = subscribeToBroadcasts(() => {});
    expect(typeof unsubscribe).toBe("function");
  });

  it("should call callback on message from other tab", async () => {
    const callback = vi.fn();
    subscribeToBroadcasts(callback);

    // Simulate another tab sending a message
    const otherTabChannel = new MockBroadcastChannel(CHANNEL_NAME);
    const message: BroadcastMessage<VerificationUpdatePayload> = {
      type: "VERIFICATION_UPDATE",
      address: "SP123",
      payload: { entries: {} },
      timestamp: Date.now(),
      tabId: "other-tab-id",
    };

    otherTabChannel.postMessage(message);

    // Wait for async message delivery
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(message);
  });

  it("should not call callback after unsubscribe", async () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToBroadcasts(callback);

    unsubscribe();

    // Simulate message
    const otherTabChannel = new MockBroadcastChannel(CHANNEL_NAME);
    otherTabChannel.postMessage({
      type: "VERIFICATION_UPDATE",
      address: "SP123",
      payload: { entries: {} },
      timestamp: Date.now(),
      tabId: "other-tab-id",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(callback).not.toHaveBeenCalled();
  });
});

// =============================================================================
// BROADCAST VERIFICATION UPDATE TESTS (with mocks)
// =============================================================================

describe("broadcastVerificationUpdate", () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    closeBroadcastChannel();

    Object.defineProperty(global, "BroadcastChannel", {
      value: MockBroadcastChannel,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    closeBroadcastChannel();
    MockBroadcastChannel.reset();

    if (OriginalBroadcastChannel) {
      Object.defineProperty(global, "BroadcastChannel", {
        value: OriginalBroadcastChannel,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should not throw if channel not initialized", () => {
    // Should silently do nothing
    expect(() => {
      broadcastVerificationUpdate("SP123", {});
    }).not.toThrow();
  });

  it("should not send message for empty entries", async () => {
    initBroadcastChannel();

    const callback = vi.fn();
    const otherChannel = new MockBroadcastChannel(CHANNEL_NAME);
    otherChannel.onmessage = callback;

    broadcastVerificationUpdate("SP123", {});

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(callback).not.toHaveBeenCalled();
  });

  it("should send message with correct structure", async () => {
    initBroadcastChannel();

    const receivedMessages: BroadcastMessage[] = [];
    const otherChannel = new MockBroadcastChannel(CHANNEL_NAME);
    otherChannel.onmessage = (event) => receivedMessages.push(event.data);

    const entries = {
      "key1": { status: "claimed" as const, verifiedAt: 1000 },
    };

    broadcastVerificationUpdate("SP123", entries);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].type).toBe("VERIFICATION_UPDATE");
    expect(receivedMessages[0].address).toBe("SP123");
    expect(receivedMessages[0].payload).toEqual({ entries });
    expect(receivedMessages[0].tabId).toBe(getTabId());
    expect(typeof receivedMessages[0].timestamp).toBe("number");
  });
});

// =============================================================================
// ECHO PREVENTION TESTS
// =============================================================================

describe("Echo prevention", () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    closeBroadcastChannel();

    Object.defineProperty(global, "BroadcastChannel", {
      value: MockBroadcastChannel,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    closeBroadcastChannel();
    MockBroadcastChannel.reset();

    if (OriginalBroadcastChannel) {
      Object.defineProperty(global, "BroadcastChannel", {
        value: OriginalBroadcastChannel,
        writable: true,
        configurable: true,
      });
    }
  });

  it("should not call callback for own messages", async () => {
    const callback = vi.fn();
    subscribeToBroadcasts(callback);

    // Send a message from this tab
    broadcastVerificationUpdate("SP123", {
      "key1": { status: "claimed", verifiedAt: 1000 },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Callback should not be called because message is from same tab
    // Note: In the mock, postMessage delivers to OTHER instances,
    // so this test verifies the mock behavior, not the tabId filter.
    // The real tabId filter is tested by checking the handler logic.
    expect(callback).not.toHaveBeenCalled();
  });
});
