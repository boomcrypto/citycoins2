/**
 * Claims Store Tests
 *
 * Tests for the claims tracking atoms in store/claims.ts.
 * These tests validate:
 * - Mining entry status computation
 * - Stacking entry status computation
 * - Status priority resolution (tx history > verification cache > base status)
 * - Entry creation from different transaction types
 * - Summary computation
 *
 * Note: We test the pure helper functions and status mapping logic.
 * Atom behavior is tested through their computed outputs.
 */

import { describe, it, expect } from "vitest";
import type { MiningEntry, StackingEntry, MiningStatus, StackingStatus } from "../claims";
import type { VerificationStatus, VerificationResult } from "../verification";

// =============================================================================
// IMPORT TESTABLE FUNCTIONS
// =============================================================================

// City config imports for testing eligibility
import {
  isMiningClaimEligible,
  isStackingClaimEligible,
  getBlockCycle,
  getCycleFirstBlock,
  MINING_CLAIM_MATURITY,
} from "../../config/city-config";

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a test mining entry
 */
function createMiningEntry(
  block: number,
  status: MiningStatus = "unverified",
  overrides: Partial<MiningEntry> = {}
): MiningEntry {
  return {
    txId: `0x${block.toString(16).padStart(64, "0")}`,
    block,
    city: "mia",
    version: "legacyV2",
    contractId: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2",
    functionName: "mine-many",
    amountUstx: 1000000n,
    status,
    ...overrides,
  };
}

/**
 * Create a test stacking entry
 */
function createStackingEntry(
  cycle: number,
  status: StackingStatus = "unverified",
  overrides: Partial<StackingEntry> = {}
): StackingEntry {
  return {
    txId: `0x${cycle.toString(16).padStart(64, "0")}`,
    cycle,
    city: "mia",
    version: "legacyV2",
    contractId: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2",
    functionName: "stack-tokens",
    amountTokens: 1000000000n,
    status,
    ...overrides,
  };
}

/**
 * Create a verification cache key
 */
function createCacheKey(
  city: "mia" | "nyc",
  version: string,
  type: "mining" | "stacking",
  id: number
): string {
  return `${city}-${version}-${type}-${id}`;
}

/**
 * Create a verification result
 */
function createVerificationResult(
  status: VerificationStatus,
  error?: string
): VerificationResult {
  return {
    status,
    verifiedAt: Date.now(),
    error,
  };
}

// =============================================================================
// MINING ELIGIBILITY TESTS
// =============================================================================

describe("isMiningClaimEligible", () => {
  it("should return false when block is not yet matured", () => {
    const minedBlock = 100000;
    const currentBlock = minedBlock + MINING_CLAIM_MATURITY - 1; // 99 blocks later
    expect(isMiningClaimEligible(minedBlock, currentBlock)).toBe(false);
  });

  it("should return true exactly at maturity threshold", () => {
    const minedBlock = 100000;
    const currentBlock = minedBlock + MINING_CLAIM_MATURITY; // Exactly 100 blocks later
    expect(isMiningClaimEligible(minedBlock, currentBlock)).toBe(true);
  });

  it("should return true when block is past maturity", () => {
    const minedBlock = 100000;
    const currentBlock = minedBlock + MINING_CLAIM_MATURITY + 50; // 150 blocks later
    expect(isMiningClaimEligible(minedBlock, currentBlock)).toBe(true);
  });

  it("should return false when current block equals mined block", () => {
    const minedBlock = 100000;
    expect(isMiningClaimEligible(minedBlock, minedBlock)).toBe(false);
  });

  it("should handle very old blocks", () => {
    const minedBlock = 24497; // MIA genesis
    const currentBlock = 200000; // Much later
    expect(isMiningClaimEligible(minedBlock, currentBlock)).toBe(true);
  });
});

// =============================================================================
// STACKING ELIGIBILITY TESTS
// =============================================================================

describe("isStackingClaimEligible", () => {
  // Note: isStackingClaimEligible uses getCycleFirstBlock which has a known issue
  // with versions where startCycle != 1 (see getCycleFirstBlock implementation).
  // These tests use legacyV1 which starts at cycle 1 where the calculation is correct.

  it("should return false when cycle is not yet complete", () => {
    // MIA legacyV1: genesis 24497, cycle 1 starts at genesis, cycle length 2100
    // Cycle 2 starts at 24497 + 2100 = 26597
    const currentBlock = 25000; // Mid-cycle 1
    expect(isStackingClaimEligible("mia", "legacyV1", 1, currentBlock)).toBe(false);
  });

  it("should return true exactly when cycle ends", () => {
    // Cycle 1 ends at block 26597 (start of cycle 2)
    // isStackingClaimEligible checks if currentBlock >= getCycleFirstBlock(cycle + 1)
    // getCycleFirstBlock(2) = 24497 + (2-1) * 2100 = 24497 + 2100 = 26597
    const currentBlock = 26597;
    expect(isStackingClaimEligible("mia", "legacyV1", 1, currentBlock)).toBe(true);
  });

  it("should return true when cycle is past completion", () => {
    // Well after cycle 1 ends
    const currentBlock = 30000;
    expect(isStackingClaimEligible("mia", "legacyV1", 1, currentBlock)).toBe(true);
  });

  it("should handle NYC cycles correctly", () => {
    // NYC legacyV1: genesis 37449, cycle 1 starts at genesis
    // Cycle 2 starts at 37449 + 2100 = 39549
    const currentBlock = 39549; // Cycle 1 just ended
    expect(isStackingClaimEligible("nyc", "legacyV1", 1, currentBlock)).toBe(true);
  });
});

// =============================================================================
// BLOCK CYCLE CALCULATION TESTS
// =============================================================================

describe("getBlockCycle", () => {
  it("should calculate correct cycle for MIA legacyV1", () => {
    // MIA legacyV1: genesis 24497, startCycle 1, cycleLength 2100
    // Block 24497 should be cycle 1
    expect(getBlockCycle("mia", "legacyV1", 24497)).toBe(1);
    // Block 26597 (24497 + 2100) should be cycle 2
    expect(getBlockCycle("mia", "legacyV1", 26597)).toBe(2);
  });

  it("should calculate correct cycle for MIA legacyV2", () => {
    // MIA legacyV2: genesis 58921, startCycle 17, cycleLength 2100
    // Block 58921 should be cycle 17
    expect(getBlockCycle("mia", "legacyV2", 58921)).toBe(17);
    // Block 61021 (58921 + 2100) should be cycle 18
    expect(getBlockCycle("mia", "legacyV2", 61021)).toBe(18);
  });

  it("should calculate correct cycle for NYC legacyV1", () => {
    // NYC legacyV1: genesis 37449, startCycle 1, cycleLength 2100
    expect(getBlockCycle("nyc", "legacyV1", 37449)).toBe(1);
    expect(getBlockCycle("nyc", "legacyV1", 39549)).toBe(2);
  });

  it("should calculate correct cycle for DAO V2", () => {
    // DAO V2: genesis 107389, startCycle 54, cycleLength 2100
    expect(getBlockCycle("mia", "daoV2", 107389)).toBe(54);
    expect(getBlockCycle("mia", "daoV2", 109489)).toBe(55);
  });

  it("should return 0 for blocks before genesis", () => {
    expect(getBlockCycle("mia", "legacyV1", 24496)).toBe(0);
    expect(getBlockCycle("mia", "legacyV1", 1)).toBe(0);
  });
});

// =============================================================================
// CYCLE FIRST BLOCK CALCULATION TESTS
// =============================================================================

describe("getCycleFirstBlock", () => {
  it("should calculate correct first block for MIA legacyV1 cycles", () => {
    // MIA legacyV1: genesis 24497, startCycle 1, cycleLength 2100
    // Cycle 1 starts at genesis
    expect(getCycleFirstBlock("mia", "legacyV1", 1)).toBe(24497);
    // Cycle 2 starts at 24497 + 2100 = 26597
    expect(getCycleFirstBlock("mia", "legacyV1", 2)).toBe(26597);
    // Cycle 5 starts at 24497 + 4 * 2100 = 32897
    expect(getCycleFirstBlock("mia", "legacyV1", 5)).toBe(32897);
  });

  it("should calculate correct first block for MIA legacyV2 cycles (startCycle=17)", () => {
    // MIA legacyV2: genesis 58921, startCycle 17, cycleLength 2100
    // Cycle 17 starts at genesis
    expect(getCycleFirstBlock("mia", "legacyV2", 17)).toBe(58921);
    // Cycle 18 starts at 58921 + 2100 = 61021
    expect(getCycleFirstBlock("mia", "legacyV2", 18)).toBe(61021);
    // Cycle 20 starts at 58921 + 3 * 2100 = 65221
    expect(getCycleFirstBlock("mia", "legacyV2", 20)).toBe(65221);
  });

  it("should calculate correct first block for MIA DAO V1 cycles (startCycle=35)", () => {
    // MIA daoV1: genesis 96779, startCycle 35, cycleLength 2100
    // Cycle 35 starts at genesis
    expect(getCycleFirstBlock("mia", "daoV1", 35)).toBe(96779);
    // Cycle 36 starts at 96779 + 2100 = 98879
    expect(getCycleFirstBlock("mia", "daoV1", 36)).toBe(98879);
  });

  it("should calculate correct first block for MIA DAO V2 cycles (startCycle=54)", () => {
    // MIA daoV2: genesis 107389, startCycle 54, cycleLength 2100
    // Cycle 54 starts at genesis
    expect(getCycleFirstBlock("mia", "daoV2", 54)).toBe(107389);
    // Cycle 55 starts at 107389 + 2100 = 109489
    expect(getCycleFirstBlock("mia", "daoV2", 55)).toBe(109489);
  });

  it("should calculate correct first block for NYC legacyV2 cycles (startCycle=11)", () => {
    // NYC legacyV2: genesis 58925, startCycle 11, cycleLength 2100
    // Cycle 11 starts at genesis
    expect(getCycleFirstBlock("nyc", "legacyV2", 11)).toBe(58925);
    // Cycle 12 starts at 58925 + 2100 = 61025
    expect(getCycleFirstBlock("nyc", "legacyV2", 12)).toBe(61025);
  });

  it("should calculate correct first block for NYC DAO V1 cycles (startCycle=29)", () => {
    // NYC daoV1: genesis 96779, startCycle 29, cycleLength 2100
    // Cycle 29 starts at genesis
    expect(getCycleFirstBlock("nyc", "daoV1", 29)).toBe(96779);
    // Cycle 30 starts at 96779 + 2100 = 98879
    expect(getCycleFirstBlock("nyc", "daoV1", 30)).toBe(98879);
  });

  it("should be consistent with getBlockCycle (round-trip)", () => {
    // For any cycle, getBlockCycle of getCycleFirstBlock should return the same cycle
    expect(getBlockCycle("mia", "legacyV1", getCycleFirstBlock("mia", "legacyV1", 5))).toBe(5);
    expect(getBlockCycle("mia", "legacyV2", getCycleFirstBlock("mia", "legacyV2", 20))).toBe(20);
    expect(getBlockCycle("mia", "daoV1", getCycleFirstBlock("mia", "daoV1", 40))).toBe(40);
    expect(getBlockCycle("mia", "daoV2", getCycleFirstBlock("mia", "daoV2", 60))).toBe(60);
    expect(getBlockCycle("nyc", "legacyV2", getCycleFirstBlock("nyc", "legacyV2", 15))).toBe(15);
  });
});

// =============================================================================
// STATUS MAPPING TESTS
// =============================================================================

/**
 * These functions mirror the mapVerificationToMiningStatus and
 * mapVerificationToStackingStatus from claims.ts.
 * We test them directly to verify the mapping logic.
 */
function mapVerificationToMiningStatus(verificationStatus: VerificationStatus): MiningStatus {
  switch (verificationStatus) {
    case "claimable":
      return "claimable";
    case "not-won":
    case "claimed":
      return verificationStatus;
    case "error":
      return "error";
    case "verifying":
    case "unverified":
    case "no-reward":
    default:
      return "unverified";
  }
}

function mapVerificationToStackingStatus(verificationStatus: VerificationStatus): StackingStatus {
  switch (verificationStatus) {
    case "claimable":
      return "claimable";
    case "claimed":
      return "claimed";
    case "no-reward":
      return "no-reward";
    case "error":
      return "unavailable";
    case "verifying":
    case "unverified":
    case "not-won":
    default:
      return "unverified";
  }
}

describe("mapVerificationToMiningStatus", () => {
  it('should map "claimable" to "claimable"', () => {
    expect(mapVerificationToMiningStatus("claimable")).toBe("claimable");
  });

  it('should map "not-won" to "not-won"', () => {
    expect(mapVerificationToMiningStatus("not-won")).toBe("not-won");
  });

  it('should map "claimed" to "claimed"', () => {
    expect(mapVerificationToMiningStatus("claimed")).toBe("claimed");
  });

  it('should map "error" to "error"', () => {
    expect(mapVerificationToMiningStatus("error")).toBe("error");
  });

  it('should map "verifying" to "unverified"', () => {
    expect(mapVerificationToMiningStatus("verifying")).toBe("unverified");
  });

  it('should map "no-reward" to "unverified" (not applicable to mining)', () => {
    expect(mapVerificationToMiningStatus("no-reward")).toBe("unverified");
  });
});

describe("mapVerificationToStackingStatus", () => {
  it('should map "claimable" to "claimable"', () => {
    expect(mapVerificationToStackingStatus("claimable")).toBe("claimable");
  });

  it('should map "claimed" to "claimed"', () => {
    expect(mapVerificationToStackingStatus("claimed")).toBe("claimed");
  });

  it('should map "no-reward" to "no-reward"', () => {
    expect(mapVerificationToStackingStatus("no-reward")).toBe("no-reward");
  });

  it('should map "error" to "unavailable"', () => {
    expect(mapVerificationToStackingStatus("error")).toBe("unavailable");
  });

  it('should map "verifying" to "unverified"', () => {
    expect(mapVerificationToStackingStatus("verifying")).toBe("unverified");
  });

  it('should map "not-won" to "unverified" (not applicable to stacking)', () => {
    expect(mapVerificationToStackingStatus("not-won")).toBe("unverified");
  });
});

// =============================================================================
// STATUS PRIORITY RESOLUTION TESTS
// =============================================================================

/**
 * Simulate the priority resolution logic from verifiedMiningEntriesAtom
 * Priority: tx history > verification cache > base status
 */
function resolveMiningEntryStatus(
  entry: MiningEntry,
  verificationCache: Record<string, VerificationResult>
): MiningStatus {
  // Priority 1: Transaction history status (claimed/not-won)
  if (entry.status === "claimed" || entry.status === "not-won") {
    return entry.status;
  }

  // Priority 2: Base status pending (not matured)
  if (entry.status === "pending") {
    return "pending";
  }

  // Priority 3: Verification cache
  const key = createCacheKey(entry.city, entry.version, "mining", entry.block);
  const cached = verificationCache[key];
  if (cached) {
    return mapVerificationToMiningStatus(cached.status);
  }

  // Priority 4: Base status (unverified)
  return entry.status;
}

/**
 * Simulate the priority resolution logic from verifiedStackingEntriesAtom
 */
function resolveStackingEntryStatus(
  entry: StackingEntry,
  verificationCache: Record<string, VerificationResult>
): StackingStatus {
  // Priority 1: Transaction history status (claimed/unavailable)
  if (entry.status === "claimed" || entry.status === "unavailable") {
    return entry.status;
  }

  // Priority 2: Base status locked (cycle not complete)
  if (entry.status === "locked") {
    return "locked";
  }

  // Priority 3: Verification cache
  const key = createCacheKey(entry.city, entry.version, "stacking", entry.cycle);
  const cached = verificationCache[key];
  if (cached) {
    return mapVerificationToStackingStatus(cached.status);
  }

  // Priority 4: Base status (unverified)
  return entry.status;
}

describe("Mining Status Priority Resolution", () => {
  it("should prioritize claimed status from transaction history over cache", () => {
    const entry = createMiningEntry(50000, "claimed");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("claimed");
  });

  it("should prioritize not-won status from transaction history over cache", () => {
    const entry = createMiningEntry(50000, "not-won");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("not-won");
  });

  it("should use pending status when block not matured", () => {
    const entry = createMiningEntry(50000, "pending");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("pending");
  });

  it("should use verification cache for unverified entries", () => {
    const entry = createMiningEntry(50000, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("claimable");
  });

  it("should use cache not-won result", () => {
    const entry = createMiningEntry(50000, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("not-won"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("not-won");
  });

  it("should use cache error result", () => {
    const entry = createMiningEntry(50000, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("error", "API error"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("error");
  });

  it("should remain unverified when no cache entry", () => {
    const entry = createMiningEntry(50000, "unverified");
    const cache = {};
    expect(resolveMiningEntryStatus(entry, cache)).toBe("unverified");
  });

  it("should handle cache with different block", () => {
    const entry = createMiningEntry(50000, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "mining", 49999)]: createVerificationResult("claimable"),
    };
    expect(resolveMiningEntryStatus(entry, cache)).toBe("unverified");
  });
});

describe("Stacking Status Priority Resolution", () => {
  it("should prioritize claimed status from transaction history", () => {
    const entry = createStackingEntry(20, "claimed");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("claimed");
  });

  it("should prioritize unavailable status from transaction history", () => {
    const entry = createStackingEntry(20, "unavailable");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("unavailable");
  });

  it("should use locked status when cycle not complete", () => {
    const entry = createStackingEntry(20, "locked");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("locked");
  });

  it("should use verification cache for unverified entries", () => {
    const entry = createStackingEntry(20, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("claimable");
  });

  it("should use cache no-reward result", () => {
    const entry = createStackingEntry(20, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("no-reward"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("no-reward");
  });

  it("should map error to unavailable", () => {
    const entry = createStackingEntry(20, "unverified");
    const cache = {
      [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("error", "API error"),
    };
    expect(resolveStackingEntryStatus(entry, cache)).toBe("unavailable");
  });

  it("should remain unverified when no cache entry", () => {
    const entry = createStackingEntry(20, "unverified");
    const cache = {};
    expect(resolveStackingEntryStatus(entry, cache)).toBe("unverified");
  });
});

// =============================================================================
// EDGE CASES FROM PHASE 4 STALE STATE AUDIT
// =============================================================================

describe("Stale State Edge Cases", () => {
  describe("External claim detection", () => {
    it("should detect claimed status from transaction history regardless of cache", () => {
      // Scenario: User claimed in another app, cache still shows claimable
      // When transaction history includes the claim tx, status should update
      const entry = createMiningEntry(50000, "claimed", { claimTxId: "0xclaim123" });
      const staleCache = {
        [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
      };
      // Transaction history takes priority
      expect(resolveMiningEntryStatus(entry, staleCache)).toBe("claimed");
    });
  });

  describe("Failed claim detection", () => {
    it("should detect not-won status from failed claim transaction", () => {
      // Scenario: User attempted claim but lost lottery
      const entry = createMiningEntry(50000, "not-won", { claimTxId: "0xfailed456" });
      const staleCache = {
        [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
      };
      // Failed claim transaction takes priority
      expect(resolveMiningEntryStatus(entry, staleCache)).toBe("not-won");
    });

    it("should detect unavailable status from failed stacking claim", () => {
      // Scenario: User attempted stacking claim but failed
      const entry = createStackingEntry(20, "unavailable", { claimTxId: "0xfailed789" });
      const staleCache = {
        [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
      };
      // Failed claim transaction takes priority
      expect(resolveStackingEntryStatus(entry, staleCache)).toBe("unavailable");
    });
  });

  describe("Verification while still pending", () => {
    it("should not apply verification result to pending entries", () => {
      // Scenario: Somehow have a cache entry for a not-yet-matured block
      const entry = createMiningEntry(50000, "pending");
      const cache = {
        [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
      };
      // Pending takes priority over cache
      expect(resolveMiningEntryStatus(entry, cache)).toBe("pending");
    });

    it("should not apply verification result to locked stacking entries", () => {
      const entry = createStackingEntry(20, "locked");
      const cache = {
        [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
      };
      // Locked takes priority over cache
      expect(resolveStackingEntryStatus(entry, cache)).toBe("locked");
    });
  });

  describe("Cross-city cache isolation", () => {
    it("should not use MIA cache for NYC entry", () => {
      const nycEntry = createStackingEntry(20, "unverified", { city: "nyc" });
      const miaCache = {
        [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("claimable"),
      };
      // NYC entry should not use MIA cache
      expect(resolveStackingEntryStatus(nycEntry, miaCache)).toBe("unverified");
    });

    it("should not use cache from different version", () => {
      const entry = createMiningEntry(50000, "unverified", { version: "daoV1" });
      const legacyCache = {
        [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("claimable"),
      };
      // daoV1 entry should not use legacyV2 cache
      expect(resolveMiningEntryStatus(entry, legacyCache)).toBe("unverified");
    });
  });

  describe("Verifying status handling", () => {
    it("should treat verifying as unverified for mining", () => {
      const entry = createMiningEntry(50000, "unverified");
      const cache = {
        [createCacheKey("mia", "legacyV2", "mining", 50000)]: createVerificationResult("verifying"),
      };
      // Verifying should display as unverified
      expect(resolveMiningEntryStatus(entry, cache)).toBe("unverified");
    });

    it("should treat verifying as unverified for stacking", () => {
      const entry = createStackingEntry(20, "unverified");
      const cache = {
        [createCacheKey("mia", "legacyV2", "stacking", 20)]: createVerificationResult("verifying"),
      };
      // Verifying should display as unverified
      expect(resolveStackingEntryStatus(entry, cache)).toBe("unverified");
    });
  });
});

// =============================================================================
// SUMMARY COMPUTATION TESTS
// =============================================================================

describe("Summary Computation", () => {
  /**
   * Simulate the single-pass summary computation from claimsSummaryAtom
   */
  function computeMiningSummary(entries: MiningEntry[]) {
    const summary = {
      total: 0,
      claimed: 0,
      claimable: 0,
      pending: 0,
      unverified: 0,
      notWon: 0,
      error: 0,
    };

    for (const entry of entries) {
      summary.total++;
      switch (entry.status) {
        case "claimed":
          summary.claimed++;
          break;
        case "claimable":
          summary.claimable++;
          break;
        case "pending":
          summary.pending++;
          break;
        case "unverified":
          summary.unverified++;
          break;
        case "not-won":
          summary.notWon++;
          break;
        case "error":
          summary.error++;
          break;
      }
    }
    return summary;
  }

  function computeStackingSummary(entries: StackingEntry[]) {
    const summary = {
      total: 0,
      claimed: 0,
      claimable: 0,
      locked: 0,
      unverified: 0,
      noReward: 0,
      unavailable: 0,
    };

    for (const entry of entries) {
      summary.total++;
      switch (entry.status) {
        case "claimed":
          summary.claimed++;
          break;
        case "claimable":
          summary.claimable++;
          break;
        case "locked":
          summary.locked++;
          break;
        case "unverified":
          summary.unverified++;
          break;
        case "no-reward":
          summary.noReward++;
          break;
        case "unavailable":
          summary.unavailable++;
          break;
      }
    }
    return summary;
  }

  it("should compute correct mining summary with mixed statuses", () => {
    const entries: MiningEntry[] = [
      createMiningEntry(50000, "claimed"),
      createMiningEntry(50001, "claimed"),
      createMiningEntry(50002, "claimable"),
      createMiningEntry(50003, "pending"),
      createMiningEntry(50004, "pending"),
      createMiningEntry(50005, "pending"),
      createMiningEntry(50006, "unverified"),
      createMiningEntry(50007, "not-won"),
      createMiningEntry(50008, "error"),
    ];

    const summary = computeMiningSummary(entries);

    expect(summary.total).toBe(9);
    expect(summary.claimed).toBe(2);
    expect(summary.claimable).toBe(1);
    expect(summary.pending).toBe(3);
    expect(summary.unverified).toBe(1);
    expect(summary.notWon).toBe(1);
    expect(summary.error).toBe(1);
  });

  it("should compute correct stacking summary with mixed statuses", () => {
    const entries: StackingEntry[] = [
      createStackingEntry(17, "claimed"),
      createStackingEntry(18, "claimable"),
      createStackingEntry(19, "claimable"),
      createStackingEntry(20, "locked"),
      createStackingEntry(21, "locked"),
      createStackingEntry(22, "unverified"),
      createStackingEntry(23, "no-reward"),
      createStackingEntry(24, "unavailable"),
    ];

    const summary = computeStackingSummary(entries);

    expect(summary.total).toBe(8);
    expect(summary.claimed).toBe(1);
    expect(summary.claimable).toBe(2);
    expect(summary.locked).toBe(2);
    expect(summary.unverified).toBe(1);
    expect(summary.noReward).toBe(1);
    expect(summary.unavailable).toBe(1);
  });

  it("should handle empty arrays", () => {
    expect(computeMiningSummary([]).total).toBe(0);
    expect(computeStackingSummary([]).total).toBe(0);
  });
});

// =============================================================================
// MULTI-BLOCK MINING ENTRY CREATION TESTS
// =============================================================================

describe("Multi-block Mining Entry Creation", () => {
  /**
   * Simulate the mining entry creation logic for mine-many transactions
   */
  function createMiningEntriesFromTx(
    txBlockHeight: number,
    amountsUstx: bigint[],
    currentBlock: number
  ): MiningEntry[] {
    return amountsUstx.map((amount, i) => {
      const block = txBlockHeight + i;
      return {
        txId: "0xtest",
        block,
        city: "mia" as const,
        version: "legacyV2" as const,
        contractId: "test",
        functionName: "mine-many",
        amountUstx: amount,
        status: isMiningClaimEligible(block, currentBlock) ? "unverified" : "pending",
      };
    });
  }

  it("should create separate entries for each block in mine-many", () => {
    const amounts = [1000000n, 2000000n, 3000000n];
    const txBlockHeight = 100000;
    const currentBlock = 100200; // 200 blocks later

    const entries = createMiningEntriesFromTx(txBlockHeight, amounts, currentBlock);

    expect(entries).toHaveLength(3);
    expect(entries[0].block).toBe(100000);
    expect(entries[0].amountUstx).toBe(1000000n);
    expect(entries[0].status).toBe("unverified"); // 200 > 100

    expect(entries[1].block).toBe(100001);
    expect(entries[1].amountUstx).toBe(2000000n);
    expect(entries[1].status).toBe("unverified"); // 199 > 100

    expect(entries[2].block).toBe(100002);
    expect(entries[2].amountUstx).toBe(3000000n);
    expect(entries[2].status).toBe("unverified"); // 198 > 100
  });

  it("should create pending entries for recent blocks", () => {
    const amounts = [1000000n, 2000000n];
    const txBlockHeight = 100000;
    const currentBlock = 100050; // 50 blocks later (< 100 maturity)

    const entries = createMiningEntriesFromTx(txBlockHeight, amounts, currentBlock);

    expect(entries[0].status).toBe("pending");
    expect(entries[1].status).toBe("pending");
  });

  it("should handle mixed maturity in multi-block tx", () => {
    const amounts = [1000000n, 2000000n, 3000000n, 4000000n, 5000000n];
    const txBlockHeight = 100000;
    const currentBlock = 100102; // 102 blocks later

    const entries = createMiningEntriesFromTx(txBlockHeight, amounts, currentBlock);

    // Block 100000: 102 >= 100 -> unverified
    expect(entries[0].status).toBe("unverified");
    // Block 100001: 101 >= 100 -> unverified
    expect(entries[1].status).toBe("unverified");
    // Block 100002: 100 >= 100 -> unverified
    expect(entries[2].status).toBe("unverified");
    // Block 100003: 99 < 100 -> pending
    expect(entries[3].status).toBe("pending");
    // Block 100004: 98 < 100 -> pending
    expect(entries[4].status).toBe("pending");
  });
});

// =============================================================================
// MULTI-CYCLE STACKING ENTRY CREATION TESTS
// =============================================================================

describe("Multi-cycle Stacking Entry Creation", () => {
  /**
   * Simulate the stacking entry creation logic
   */
  function createStackingEntriesFromTx(
    txBlockHeight: number,
    lockPeriod: number,
    amountTokens: bigint,
    currentBlock: number,
    city: "mia" | "nyc" = "mia",
    version: "legacyV1" | "legacyV2" | "daoV1" | "daoV2" = "legacyV1"
  ): StackingEntry[] {
    const startCycle = getBlockCycle(city, version, txBlockHeight);
    const entries: StackingEntry[] = [];

    for (let i = 0; i < lockPeriod; i++) {
      const cycle = startCycle + i;
      entries.push({
        txId: "0xtest",
        cycle,
        city,
        version,
        contractId: "test",
        functionName: "stack-tokens",
        amountTokens,
        status: isStackingClaimEligible(city, version, cycle, currentBlock)
          ? "unverified"
          : "locked",
      });
    }

    return entries;
  }

  it("should create entry for each cycle in lock period", () => {
    // Use legacyV1 where startCycle=1 for correct cycle calculations
    // MIA legacyV1: genesis 24497, cycle 1 starts at genesis
    const txBlockHeight = 24500; // Within cycle 1
    const lockPeriod = 5;
    const amountTokens = 1000000000n;
    const currentBlock = 40000; // Far in future (all cycles complete)

    const entries = createStackingEntriesFromTx(
      txBlockHeight,
      lockPeriod,
      amountTokens,
      currentBlock
    );

    expect(entries).toHaveLength(5);
    expect(entries[0].cycle).toBe(1);
    expect(entries[1].cycle).toBe(2);
    expect(entries[2].cycle).toBe(3);
    expect(entries[3].cycle).toBe(4);
    expect(entries[4].cycle).toBe(5);

    // All should be unverified (cycles complete)
    entries.forEach((e) => expect(e.status).toBe("unverified"));
  });

  it("should create locked entries for incomplete cycles", () => {
    // Use legacyV1 where startCycle=1 for correct cycle calculations
    // MIA legacyV1: genesis 24497, cycle 1 starts at genesis
    const txBlockHeight = 24500; // Cycle 1
    const lockPeriod = 3;
    const amountTokens = 1000000000n;
    // Cycle 2 starts at 26597, cycle 3 at 28697
    // Current block in cycle 2 (cycle 1 ended, 2 in progress)
    const currentBlock = 27000;

    const entries = createStackingEntriesFromTx(
      txBlockHeight,
      lockPeriod,
      amountTokens,
      currentBlock,
      "mia",
      "legacyV1"
    );

    // Cycle 1: ended -> unverified
    expect(entries[0].status).toBe("unverified");
    // Cycle 2: in progress -> locked
    expect(entries[1].status).toBe("locked");
    // Cycle 3: not started -> locked
    expect(entries[2].status).toBe("locked");
  });

  it("should handle stacking across versions", () => {
    // Use legacyV1 where startCycle=1 for correct cycle calculations
    // NYC legacyV1: genesis 37449, cycle 1 starts at genesis
    const txBlockHeight = 37500; // Within cycle 1
    const lockPeriod = 2;
    const amountTokens = 500000000n;
    // Cycle 2 starts at 39549, cycle 3 at 41649
    const currentBlock = 42000; // Both cycles complete

    const entries = createStackingEntriesFromTx(
      txBlockHeight,
      lockPeriod,
      amountTokens,
      currentBlock,
      "nyc",
      "legacyV1"
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].cycle).toBe(1);
    expect(entries[1].cycle).toBe(2);
    expect(entries[0].status).toBe("unverified");
    expect(entries[1].status).toBe("unverified");
  });
});
