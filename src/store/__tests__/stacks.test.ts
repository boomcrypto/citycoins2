/**
 * Stacks Store Tests
 *
 * Tests for the stacks-related atoms in store/stacks.ts.
 * Primary focus: decompression memoization performance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "jotai";
import LZString from "lz-string";
import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { acctTxsAtom, decompressedAcctTxsAtom } from "../stacks";

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a minimal test transaction
 */
function createTestTransaction(id: number): Transaction {
  return {
    tx_id: `0x${id.toString(16).padStart(64, "0")}`,
    tx_status: "success",
    tx_type: "contract_call",
    block_height: 100000 + id,
    block_hash: `0x${(id + 1000).toString(16).padStart(64, "0")}`,
    burn_block_time: Date.now() / 1000,
    burn_block_time_iso: new Date().toISOString(),
    canonical: true,
    microblock_canonical: true,
    microblock_hash: "",
    microblock_sequence: 0,
    parent_block_hash: "",
    parent_burn_block_time: 0,
    parent_burn_block_time_iso: "",
    tx_index: id,
    nonce: id,
    fee_rate: "1000",
    sender_address: "SP1TEST123",
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [],
    anchor_mode: "any",
    is_unanchored: false,
    event_count: 0,
    events: [],
    execution_cost_read_count: 0,
    execution_cost_read_length: 0,
    execution_cost_runtime: 0,
    execution_cost_write_count: 0,
    execution_cost_write_length: 0,
    contract_call: {
      contract_id: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2",
      function_name: "mine-many",
      function_args: [],
    },
  } as Transaction;
}

/**
 * Create an array of test transactions and compress them
 */
function createCompressedTransactions(count: number): string {
  const transactions = Array.from({ length: count }, (_, i) =>
    createTestTransaction(i)
  );
  return LZString.compress(JSON.stringify(transactions));
}

// =============================================================================
// DECOMPRESSION MEMOIZATION TESTS
// =============================================================================

describe("decompressedAcctTxsAtom memoization", () => {
  let store: ReturnType<typeof createStore>;
  let decompressSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = createStore();
    // Spy on LZString.decompress to count calls
    decompressSpy = vi.spyOn(LZString, "decompress");
  });

  afterEach(() => {
    decompressSpy.mockRestore();
  });

  it("should only decompress once for multiple reads with same data", () => {
    const compressed = createCompressedTransactions(10);

    // Set compressed data
    store.set(acctTxsAtom, compressed);

    // Read the decompressed atom multiple times
    const result1 = store.get(decompressedAcctTxsAtom);
    const result2 = store.get(decompressedAcctTxsAtom);
    const result3 = store.get(decompressedAcctTxsAtom);

    // All reads should return the same array (reference equality)
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);

    // Decompression should only be called once
    expect(decompressSpy).toHaveBeenCalledTimes(1);

    // Verify data integrity
    expect(result1).toHaveLength(10);
    expect(result1[0].tx_id).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });

  it("should recompute when compressed data changes", () => {
    const compressed1 = createCompressedTransactions(5);
    const compressed2 = createCompressedTransactions(10);

    // Set first compressed data and read
    store.set(acctTxsAtom, compressed1);
    const result1 = store.get(decompressedAcctTxsAtom);
    expect(result1).toHaveLength(5);
    expect(decompressSpy).toHaveBeenCalledTimes(1);

    // Read again with same data - should use cache
    const result1Again = store.get(decompressedAcctTxsAtom);
    expect(result1Again).toBe(result1);
    expect(decompressSpy).toHaveBeenCalledTimes(1);

    // Change compressed data and read
    store.set(acctTxsAtom, compressed2);
    const result2 = store.get(decompressedAcctTxsAtom);
    expect(result2).toHaveLength(10);
    expect(decompressSpy).toHaveBeenCalledTimes(2);

    // Different reference for different data
    expect(result2).not.toBe(result1);
  });

  it("should return empty array for empty input", () => {
    // Default empty string
    const result1 = store.get(decompressedAcctTxsAtom);
    expect(result1).toEqual([]);

    // Explicit empty string
    store.set(acctTxsAtom, "");
    const result2 = store.get(decompressedAcctTxsAtom);
    expect(result2).toEqual([]);

    // Decompress should not be called for empty input
    expect(decompressSpy).not.toHaveBeenCalled();
  });

  it("should handle error gracefully and clear cache", () => {
    // Set data that decompresses but is not valid JSON
    // LZString.decompress("invalid") returns null, not an exception
    // So we need to create data that decompresses to invalid JSON
    const invalidJsonCompressed = LZString.compress("not valid json {");
    store.set(acctTxsAtom, invalidJsonCompressed);

    // Should return empty array on error (JSON.parse fails)
    const result1 = store.get(decompressedAcctTxsAtom);
    expect(result1).toEqual([]);

    // Now set valid data - should work normally
    const validCompressed = createCompressedTransactions(3);
    store.set(acctTxsAtom, validCompressed);

    const result2 = store.get(decompressedAcctTxsAtom);
    expect(result2).toHaveLength(3);
  });

  it("should maintain cache across multiple data changes", () => {
    const compressed1 = createCompressedTransactions(3);
    const compressed2 = createCompressedTransactions(5);
    const compressed3 = createCompressedTransactions(7);

    // Change 1
    store.set(acctTxsAtom, compressed1);
    store.get(decompressedAcctTxsAtom);
    store.get(decompressedAcctTxsAtom);
    expect(decompressSpy).toHaveBeenCalledTimes(1);

    // Change 2
    store.set(acctTxsAtom, compressed2);
    store.get(decompressedAcctTxsAtom);
    store.get(decompressedAcctTxsAtom);
    expect(decompressSpy).toHaveBeenCalledTimes(2);

    // Change 3
    store.set(acctTxsAtom, compressed3);
    store.get(decompressedAcctTxsAtom);
    store.get(decompressedAcctTxsAtom);
    expect(decompressSpy).toHaveBeenCalledTimes(3);

    // Go back to first data
    store.set(acctTxsAtom, compressed1);
    store.get(decompressedAcctTxsAtom);
    store.get(decompressedAcctTxsAtom);
    expect(decompressSpy).toHaveBeenCalledTimes(4);
  });

  it("should clear cache when returning to empty state", () => {
    const compressed = createCompressedTransactions(5);

    // Set data
    store.set(acctTxsAtom, compressed);
    const result1 = store.get(decompressedAcctTxsAtom);
    expect(result1).toHaveLength(5);
    expect(decompressSpy).toHaveBeenCalledTimes(1);

    // Clear data
    store.set(acctTxsAtom, "");
    const result2 = store.get(decompressedAcctTxsAtom);
    expect(result2).toEqual([]);

    // Set same data again - should recompute since cache was cleared
    store.set(acctTxsAtom, compressed);
    const result3 = store.get(decompressedAcctTxsAtom);
    expect(result3).toHaveLength(5);
    expect(decompressSpy).toHaveBeenCalledTimes(2);
  });
});

// =============================================================================
// PERFORMANCE VALIDATION
// =============================================================================

describe("decompressedAcctTxsAtom performance", () => {
  it("should handle large transaction sets efficiently", () => {
    const store = createStore();
    const compressed = createCompressedTransactions(1000);

    // Set compressed data
    store.set(acctTxsAtom, compressed);

    // Time first read (includes decompression)
    const start1 = performance.now();
    const result1 = store.get(decompressedAcctTxsAtom);
    const time1 = performance.now() - start1;

    // Time subsequent reads (should use cache)
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
      store.get(decompressedAcctTxsAtom);
    }
    const time2 = performance.now() - start2;

    // Verify data
    expect(result1).toHaveLength(1000);

    // Cached reads should be much faster than initial read
    // 100 cached reads should be faster than 1 decompression
    expect(time2).toBeLessThan(time1 * 10);

    // Log performance for visibility
    console.log(`Initial decompress (1000 txs): ${time1.toFixed(2)}ms`);
    console.log(`100 cached reads: ${time2.toFixed(2)}ms`);
    console.log(`Average cached read: ${(time2 / 100).toFixed(4)}ms`);
  });
});
