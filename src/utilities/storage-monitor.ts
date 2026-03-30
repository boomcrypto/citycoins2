/**
 * Storage Monitor
 *
 * Monitors localStorage usage and provides warnings/actions
 * when approaching the 5MB browser limit.
 *
 * Thresholds:
 * - Warning: 3MB - Show notification to user
 * - Critical: 4MB - Offer to clear old data
 * - Exceeded: 5MB - Graceful fallback
 */

// =============================================================================
// TYPES
// =============================================================================

export interface StorageInfo {
  /** Bytes used by citycoins-prefixed keys */
  used: number;
  /** Total bytes used in localStorage (all keys) */
  total: number;
  /** Percentage of 5MB limit used by citycoins data */
  percentage: number;
  /** Size breakdown by key (citycoins keys only) */
  breakdown: Record<string, number>;
}

export type StorageLevel = "ok" | "warning" | "critical" | "exceeded";

export interface StorageCheckResult {
  ok: boolean;
  level: StorageLevel;
  info: StorageInfo;
}

export interface StorageWarningEvent {
  level: StorageLevel;
  info: StorageInfo;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const STORAGE_THRESHOLDS = {
  WARNING: 3 * 1024 * 1024, // 3MB
  CRITICAL: 4 * 1024 * 1024, // 4MB
  MAX: 5 * 1024 * 1024, // 5MB browser limit
} as const;

/** Prefix used by all citycoins localStorage keys */
const CITYCOINS_PREFIX = "citycoins-";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate the byte size of a string (UTF-16)
 */
export function getStringByteSize(str: string): number {
  // localStorage stores strings as UTF-16, so each character is 2 bytes
  return str.length * 2;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get current localStorage usage information
 *
 * Returns breakdown of storage used by citycoins keys.
 */
export function getStorageInfo(): StorageInfo {
  const breakdown: Record<string, number> = {};
  let used = 0;
  let total = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key) || "";
      const size = getStringByteSize(key) + getStringByteSize(value);
      total += size;

      if (key.startsWith(CITYCOINS_PREFIX)) {
        breakdown[key] = size;
        used += size;
      }
    }
  } catch {
    // localStorage may not be available (e.g., private browsing)
    // Return zeros in that case
  }

  return {
    used,
    total,
    percentage: Math.round((used / STORAGE_THRESHOLDS.MAX) * 100),
    breakdown,
  };
}

/**
 * Get the current storage level based on usage
 */
export function getStorageLevel(info?: StorageInfo): StorageLevel {
  const { used } = info || getStorageInfo();

  if (used >= STORAGE_THRESHOLDS.MAX) return "exceeded";
  if (used >= STORAGE_THRESHOLDS.CRITICAL) return "critical";
  if (used >= STORAGE_THRESHOLDS.WARNING) return "warning";
  return "ok";
}

/**
 * Check if we can safely save data of a given size
 *
 * @param additionalSize - Size in bytes to add
 * @returns Check result with level and info
 */
export function canSaveData(additionalSize: number): StorageCheckResult {
  const info = getStorageInfo();
  const projectedUsed = info.used + additionalSize;

  // Check projected usage after save
  let level: StorageLevel = "ok";
  if (projectedUsed >= STORAGE_THRESHOLDS.MAX) {
    level = "exceeded";
  } else if (projectedUsed >= STORAGE_THRESHOLDS.CRITICAL) {
    level = "critical";
  } else if (projectedUsed >= STORAGE_THRESHOLDS.WARNING) {
    level = "warning";
  }

  return {
    ok: level !== "exceeded",
    level,
    info: {
      ...info,
      used: projectedUsed, // Return projected usage
      percentage: Math.round((projectedUsed / STORAGE_THRESHOLDS.MAX) * 100),
    },
  };
}

/**
 * Safely set an item in localStorage with quota error handling
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if saved successfully, false if quota exceeded
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      emitStorageWarning("exceeded", getStorageInfo());
      return false;
    }
    // Re-throw non-quota errors
    throw error;
  }
}

/**
 * Check if an error is a QuotaExceededError
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Most browsers
    if (error.name === "QuotaExceededError") return true;
    // Firefox
    if (error.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
    // Legacy
    if (error.code === 22) return true;
  }
  return false;
}

// =============================================================================
// EVENTS
// =============================================================================

/** Custom event name for storage warnings */
export const STORAGE_WARNING_EVENT = "citycoins:storage-warning";

/**
 * Emit a storage warning event
 *
 * Components can listen for this event to show user notifications.
 */
export function emitStorageWarning(
  level: StorageLevel,
  info: StorageInfo
): void {
  const event = new CustomEvent<StorageWarningEvent>(STORAGE_WARNING_EVENT, {
    detail: { level, info },
  });
  window.dispatchEvent(event);
}

// =============================================================================
// TYPE AUGMENTATION
// =============================================================================

// Extend WindowEventMap for TypeScript
declare global {
  interface WindowEventMap {
    [STORAGE_WARNING_EVENT]: CustomEvent<StorageWarningEvent>;
  }
}
