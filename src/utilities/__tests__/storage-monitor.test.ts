/**
 * Storage Monitor Tests
 *
 * Tests for localStorage size monitoring utility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatBytes,
  getStringByteSize,
  getStorageInfo,
  getStorageLevel,
  canSaveData,
  safeSetItem,
  isQuotaExceededError,
  emitStorageWarning,
  STORAGE_THRESHOLDS,
  STORAGE_WARNING_EVENT,
} from "../storage-monitor";

// =============================================================================
// MOCK SETUP
// =============================================================================

// Store the original localStorage
const originalLocalStorage = global.localStorage;

// Mock window for event tests
const windowEventListeners: Record<string, Function[]> = {};
const mockWindow = {
  addEventListener: (event: string, handler: Function) => {
    if (!windowEventListeners[event]) {
      windowEventListeners[event] = [];
    }
    windowEventListeners[event].push(handler);
  },
  removeEventListener: (event: string, handler: Function) => {
    if (windowEventListeners[event]) {
      windowEventListeners[event] = windowEventListeners[event].filter(
        (h) => h !== handler
      );
    }
  },
  dispatchEvent: (event: CustomEvent) => {
    const handlers = windowEventListeners[event.type] || [];
    handlers.forEach((handler) => handler(event));
  },
};

// Set up global window mock
Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

// Create a mock localStorage
function createMockLocalStorage(
  items: Record<string, string> = {}
): Storage {
  const store: Record<string, string> = { ...items };

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

// =============================================================================
// FORMAT BYTES TESTS
// =============================================================================

describe("formatBytes", () => {
  it("should format 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("should format bytes less than 1KB", () => {
    expect(formatBytes(100)).toBe("100 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("should format kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10 * 1024)).toBe("10.0 KB");
    expect(formatBytes(1024 * 1024 - 1)).toBe("1024.0 KB");
  });

  it("should format megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.50 MB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.00 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

// =============================================================================
// STRING BYTE SIZE TESTS
// =============================================================================

describe("getStringByteSize", () => {
  it("should return 0 for empty string", () => {
    expect(getStringByteSize("")).toBe(0);
  });

  it("should calculate UTF-16 size (2 bytes per char)", () => {
    expect(getStringByteSize("a")).toBe(2);
    expect(getStringByteSize("hello")).toBe(10);
    expect(getStringByteSize("test")).toBe(8);
  });

  it("should handle unicode characters", () => {
    // Each character is still 1 JavaScript char = 2 bytes
    expect(getStringByteSize("\u0000")).toBe(2);
  });
});

// =============================================================================
// GET STORAGE INFO TESTS
// =============================================================================

describe("getStorageInfo", () => {
  beforeEach(() => {
    // Reset localStorage mock
    Object.defineProperty(global, "localStorage", {
      value: createMockLocalStorage(),
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("should return zeros for empty localStorage", () => {
    const info = getStorageInfo();
    expect(info.used).toBe(0);
    expect(info.total).toBe(0);
    expect(info.percentage).toBe(0);
    expect(Object.keys(info.breakdown)).toHaveLength(0);
  });

  it("should only count citycoins-prefixed keys in used", () => {
    localStorage.setItem("citycoins-test", "value");
    localStorage.setItem("other-key", "data");

    const info = getStorageInfo();

    // citycoins-test: (14 chars * 2) + (5 chars * 2) = 28 + 10 = 38 bytes
    expect(info.breakdown["citycoins-test"]).toBe(38);

    // Total should include both keys
    // other-key: (9 chars * 2) + (4 chars * 2) = 18 + 8 = 26 bytes
    expect(info.total).toBe(38 + 26);

    // Used should only include citycoins key
    expect(info.used).toBe(38);
  });

  it("should calculate percentage correctly", () => {
    // Create a 1MB string (500k chars * 2 bytes = 1MB)
    const largeValue = "x".repeat(500 * 1024);
    localStorage.setItem("citycoins-large", largeValue);

    const info = getStorageInfo();
    // ~1MB out of 5MB = ~20%
    expect(info.percentage).toBeGreaterThan(15);
    expect(info.percentage).toBeLessThan(25);
  });

  it("should include all citycoins keys in breakdown", () => {
    localStorage.setItem("citycoins-stacks-blocks", "{}");
    localStorage.setItem("citycoins-stacks-acctTxs", "compressed");
    localStorage.setItem("citycoins-user-ids", "null");

    const info = getStorageInfo();
    expect(Object.keys(info.breakdown)).toHaveLength(3);
    expect(info.breakdown["citycoins-stacks-blocks"]).toBeDefined();
    expect(info.breakdown["citycoins-stacks-acctTxs"]).toBeDefined();
    expect(info.breakdown["citycoins-user-ids"]).toBeDefined();
  });
});

// =============================================================================
// GET STORAGE LEVEL TESTS
// =============================================================================

describe("getStorageLevel", () => {
  it("should return 'ok' for usage below warning threshold", () => {
    const info = {
      used: 1 * 1024 * 1024, // 1MB
      total: 1 * 1024 * 1024,
      percentage: 20,
      breakdown: {},
    };
    expect(getStorageLevel(info)).toBe("ok");
  });

  it("should return 'warning' at 3MB threshold", () => {
    const info = {
      used: STORAGE_THRESHOLDS.WARNING, // 3MB
      total: 3 * 1024 * 1024,
      percentage: 60,
      breakdown: {},
    };
    expect(getStorageLevel(info)).toBe("warning");
  });

  it("should return 'critical' at 4MB threshold", () => {
    const info = {
      used: STORAGE_THRESHOLDS.CRITICAL, // 4MB
      total: 4 * 1024 * 1024,
      percentage: 80,
      breakdown: {},
    };
    expect(getStorageLevel(info)).toBe("critical");
  });

  it("should return 'exceeded' at 5MB threshold", () => {
    const info = {
      used: STORAGE_THRESHOLDS.MAX, // 5MB
      total: 5 * 1024 * 1024,
      percentage: 100,
      breakdown: {},
    };
    expect(getStorageLevel(info)).toBe("exceeded");
  });

  it("should handle values between thresholds correctly", () => {
    // Just under warning
    expect(
      getStorageLevel({ used: 2.9 * 1024 * 1024, total: 0, percentage: 0, breakdown: {} })
    ).toBe("ok");

    // Just over warning, under critical
    expect(
      getStorageLevel({ used: 3.5 * 1024 * 1024, total: 0, percentage: 0, breakdown: {} })
    ).toBe("warning");

    // Just over critical, under max
    expect(
      getStorageLevel({ used: 4.5 * 1024 * 1024, total: 0, percentage: 0, breakdown: {} })
    ).toBe("critical");
  });
});

// =============================================================================
// CAN SAVE DATA TESTS
// =============================================================================

describe("canSaveData", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: createMockLocalStorage(),
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("should return ok=true when storage is empty", () => {
    const result = canSaveData(1024); // 1KB
    expect(result.ok).toBe(true);
    expect(result.level).toBe("ok");
  });

  it("should return warning when projected usage exceeds 3MB", () => {
    // Fill storage to just under 3MB
    const underWarning = "x".repeat((2.9 * 1024 * 1024) / 2);
    localStorage.setItem("citycoins-existing", underWarning);

    // Try to add 200KB more (would push over 3MB)
    const result = canSaveData(200 * 1024);
    expect(result.level).toBe("warning");
    expect(result.ok).toBe(true); // Still ok to save at warning
  });

  it("should return ok=false when projected usage exceeds 5MB", () => {
    // Fill storage to 4.5MB
    const existing = "x".repeat((4.5 * 1024 * 1024) / 2);
    localStorage.setItem("citycoins-existing", existing);

    // Try to add 1MB more (would exceed 5MB)
    const result = canSaveData(1 * 1024 * 1024);
    expect(result.ok).toBe(false);
    expect(result.level).toBe("exceeded");
  });

  it("should return projected usage in info", () => {
    localStorage.setItem("citycoins-test", "data");

    const additionalSize = 1000;
    const result = canSaveData(additionalSize);

    // Info should reflect projected usage
    expect(result.info.used).toBeGreaterThan(additionalSize);
  });
});

// =============================================================================
// SAFE SET ITEM TESTS
// =============================================================================

describe("safeSetItem", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: createMockLocalStorage(),
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("should return true on successful save", () => {
    const result = safeSetItem("test-key", "test-value");
    expect(result).toBe(true);
    expect(localStorage.getItem("test-key")).toBe("test-value");
  });

  it("should return false and emit event on quota exceeded", () => {
    // Create a mock that throws QuotaExceededError
    const mockStorage = createMockLocalStorage();
    mockStorage.setItem = () => {
      const error = new DOMException("Quota exceeded", "QuotaExceededError");
      throw error;
    };
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      writable: true,
    });

    // Listen for the event
    const eventHandler = vi.fn();
    window.addEventListener(STORAGE_WARNING_EVENT, eventHandler);

    const result = safeSetItem("test-key", "test-value");

    expect(result).toBe(false);
    expect(eventHandler).toHaveBeenCalled();

    window.removeEventListener(STORAGE_WARNING_EVENT, eventHandler);
  });

  it("should re-throw non-quota errors", () => {
    const mockStorage = createMockLocalStorage();
    mockStorage.setItem = () => {
      throw new Error("Some other error");
    };
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      writable: true,
    });

    expect(() => safeSetItem("test-key", "test-value")).toThrow(
      "Some other error"
    );
  });
});

// =============================================================================
// IS QUOTA EXCEEDED ERROR TESTS
// =============================================================================

describe("isQuotaExceededError", () => {
  it("should return true for QuotaExceededError", () => {
    const error = new DOMException("Quota exceeded", "QuotaExceededError");
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it("should return true for Firefox NS_ERROR_DOM_QUOTA_REACHED", () => {
    const error = new DOMException("Quota reached", "NS_ERROR_DOM_QUOTA_REACHED");
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it("should return false for other DOMExceptions", () => {
    const error = new DOMException("Not found", "NotFoundError");
    expect(isQuotaExceededError(error)).toBe(false);
  });

  it("should return false for regular errors", () => {
    const error = new Error("Regular error");
    expect(isQuotaExceededError(error)).toBe(false);
  });

  it("should return false for non-error values", () => {
    expect(isQuotaExceededError(null)).toBe(false);
    expect(isQuotaExceededError(undefined)).toBe(false);
    expect(isQuotaExceededError("error string")).toBe(false);
    expect(isQuotaExceededError(42)).toBe(false);
  });
});

// =============================================================================
// EMIT STORAGE WARNING TESTS
// =============================================================================

describe("emitStorageWarning", () => {
  it("should dispatch custom event with correct detail", () => {
    const handler = vi.fn();
    window.addEventListener(STORAGE_WARNING_EVENT, handler);

    const info = {
      used: 3.5 * 1024 * 1024,
      total: 4 * 1024 * 1024,
      percentage: 70,
      breakdown: { "citycoins-test": 100 },
    };

    emitStorageWarning("warning", info);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.detail.level).toBe("warning");
    expect(event.detail.info).toEqual(info);

    window.removeEventListener(STORAGE_WARNING_EVENT, handler);
  });

  it("should work with all storage levels", () => {
    const handler = vi.fn();
    window.addEventListener(STORAGE_WARNING_EVENT, handler);

    const info = { used: 0, total: 0, percentage: 0, breakdown: {} };

    emitStorageWarning("ok", info);
    emitStorageWarning("warning", info);
    emitStorageWarning("critical", info);
    emitStorageWarning("exceeded", info);

    expect(handler).toHaveBeenCalledTimes(4);

    window.removeEventListener(STORAGE_WARNING_EVENT, handler);
  });
});

// =============================================================================
// THRESHOLD CONSTANT TESTS
// =============================================================================

describe("STORAGE_THRESHOLDS", () => {
  it("should have correct values", () => {
    expect(STORAGE_THRESHOLDS.WARNING).toBe(3 * 1024 * 1024);
    expect(STORAGE_THRESHOLDS.CRITICAL).toBe(4 * 1024 * 1024);
    expect(STORAGE_THRESHOLDS.MAX).toBe(5 * 1024 * 1024);
  });

  it("should be in ascending order", () => {
    expect(STORAGE_THRESHOLDS.WARNING).toBeLessThan(
      STORAGE_THRESHOLDS.CRITICAL
    );
    expect(STORAGE_THRESHOLDS.CRITICAL).toBeLessThan(STORAGE_THRESHOLDS.MAX);
  });
});
