/**
 * Transaction Decoding Tests
 *
 * Tests for the transaction argument decoding functions in transactions.ts.
 * These tests validate:
 * - Mining transaction argument parsing (mine-tokens, mine-many, mine)
 * - Stacking transaction argument parsing (stack-tokens, stack)
 * - Mining claim transaction parsing (claim-mining-reward)
 * - Stacking claim transaction parsing (claim-stacking-reward)
 * - Validation functions for each transaction type
 * - Edge cases and malformed transaction handling
 */

import { describe, it, expect } from "vitest";
import { serializeCV, uintCV, listCV, stringAsciiCV } from "@stacks/transactions";
import type { Transaction, ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
} from "../transactions";

// =============================================================================
// TEST FIXTURES - Transaction Builders
// =============================================================================

/**
 * Create a mock ContractCallTransaction for testing
 */
function createMockContractCallTx(
  contractId: string,
  functionName: string,
  functionArgs: { name: string; hex: string }[],
  overrides: Partial<ContractCallTransaction> = {}
): Transaction {
  return {
    tx_id: `0x${Math.random().toString(16).slice(2)}`,
    tx_type: "contract_call",
    tx_status: "success",
    block_height: 100000,
    burn_block_time: Date.now() / 1000,
    canonical: true,
    contract_call: {
      contract_id: contractId,
      function_name: functionName,
      function_args: functionArgs,
      function_signature: "",
    },
    ...overrides,
  } as Transaction;
}

/**
 * Serialize a Clarity value to hex string (with 0x prefix)
 * Note: serializeCV returns a hex string in @stacks/transactions v7+
 */
function toHex(cv: ReturnType<typeof uintCV>): string {
  const serialized = serializeCV(cv);
  // serializeCV returns a hex string (without 0x prefix) in newer versions
  if (typeof serialized === "string") {
    return serialized.startsWith("0x") ? serialized : "0x" + serialized;
  }
  // Fallback for older versions that return Uint8Array
  let hex = "0x";
  for (let i = 0; i < serialized.length; i++) {
    hex += serialized[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// =============================================================================
// CONTRACT IDs for Testing
// =============================================================================

// MIA Legacy V1 contracts
const MIA_LEGACY_V1_CORE = "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1";
// MIA Legacy V2 contracts
const MIA_LEGACY_V2_CORE = "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2";
// MIA DAO V1 mining contract (shared)
const MIA_DAO_V1_MINING = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining";
// MIA DAO V2 mining contract (shared)
const MIA_DAO_V2_MINING = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd006-citycoin-mining-v2";
// MIA DAO stacking contract (shared)
const MIA_DAO_STACKING = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd007-citycoin-stacking";
// MIA DAO treasury stacking claim contract
const MIA_DAO_TREASURY_STACKING = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-mia-stacking";

// NYC Legacy V1 contracts
const NYC_LEGACY_V1_CORE = "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1";
// NYC DAO treasury stacking claim contract
const NYC_DAO_TREASURY_STACKING = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd002-treasury-nyc-stacking";

// Non-CityCoins contract (should be ignored)
const UNRELATED_CONTRACT = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.some-random-contract";

// =============================================================================
// VALIDATION FUNCTION TESTS
// =============================================================================

describe("isValidMiningTxArgs", () => {
  it("should validate mine-tokens args with single amount", () => {
    const args = {
      functionName: "mine-tokens",
      amountsUstx: [1000000n],
    };
    expect(isValidMiningTxArgs(args)).toBe(true);
  });

  it("should validate mine-many args with multiple amounts", () => {
    const args = {
      functionName: "mine-many",
      amountsUstx: [1000000n, 2000000n, 3000000n],
    };
    expect(isValidMiningTxArgs(args)).toBe(true);
  });

  it("should validate DAO mine args with cityName", () => {
    const args = {
      functionName: "mine",
      amountsUstx: [500000n, 500000n],
      cityName: "mia",
    };
    expect(isValidMiningTxArgs(args)).toBe(true);
  });

  it("should reject invalid function name", () => {
    const args = {
      functionName: "transfer",
      amountsUstx: [1000000n],
    };
    expect(isValidMiningTxArgs(args)).toBe(false);
  });

  it("should reject empty amounts array", () => {
    // Empty arrays should be rejected since they represent invalid mining transactions
    const args = {
      functionName: "mine-tokens",
      amountsUstx: [],
    };
    expect(isValidMiningTxArgs(args)).toBe(false);
  });

  it("should reject zero amount", () => {
    const args = {
      functionName: "mine-tokens",
      amountsUstx: [0n],
    };
    expect(isValidMiningTxArgs(args)).toBe(false);
  });

  it("should reject negative amounts", () => {
    const args = {
      functionName: "mine-tokens",
      amountsUstx: [-1000000n],
    };
    expect(isValidMiningTxArgs(args)).toBe(false);
  });

  it("should reject non-bigint amounts", () => {
    const args = {
      functionName: "mine-tokens",
      amountsUstx: [1000000], // number, not bigint
    };
    expect(isValidMiningTxArgs(args)).toBe(false);
  });

  it("should handle undefined", () => {
    expect(isValidMiningTxArgs(undefined)).toBe(false);
  });

  it("should handle null input gracefully", () => {
    // Null is handled with explicit check: decoded !== null
    expect(isValidMiningTxArgs(null)).toBe(false);
  });
});

describe("isValidStackingTxArgs", () => {
  it("should validate stack-tokens args", () => {
    const args = {
      functionName: "stack-tokens",
      amountToken: 1000000000n,
      lockPeriod: 3n,
    };
    expect(isValidStackingTxArgs(args)).toBe(true);
  });

  it("should validate DAO stack args with cityName", () => {
    const args = {
      functionName: "stack",
      amountToken: 500000000n,
      lockPeriod: 6n,
      cityName: "nyc",
    };
    expect(isValidStackingTxArgs(args)).toBe(true);
  });

  it("should reject invalid function name", () => {
    const args = {
      functionName: "stake",
      amountToken: 1000000000n,
      lockPeriod: 3n,
    };
    expect(isValidStackingTxArgs(args)).toBe(false);
  });

  it("should reject zero amount", () => {
    const args = {
      functionName: "stack-tokens",
      amountToken: 0n,
      lockPeriod: 3n,
    };
    expect(isValidStackingTxArgs(args)).toBe(false);
  });

  it("should reject zero lock period", () => {
    const args = {
      functionName: "stack-tokens",
      amountToken: 1000000000n,
      lockPeriod: 0n,
    };
    expect(isValidStackingTxArgs(args)).toBe(false);
  });

  it("should handle undefined", () => {
    expect(isValidStackingTxArgs(undefined)).toBe(false);
  });

  it("should handle null input gracefully", () => {
    expect(isValidStackingTxArgs(null)).toBe(false);
  });
});

describe("isValidMiningClaimTxArgs", () => {
  it("should validate claim-mining-reward args", () => {
    const args = {
      functionName: "claim-mining-reward",
      minerBlockHeight: 12345n,
    };
    expect(isValidMiningClaimTxArgs(args)).toBe(true);
  });

  it("should validate claim with cityName", () => {
    const args = {
      functionName: "claim-mining-reward",
      minerBlockHeight: 100000n,
      cityName: "mia",
    };
    expect(isValidMiningClaimTxArgs(args)).toBe(true);
  });

  it("should reject invalid function name", () => {
    const args = {
      functionName: "claim-reward",
      minerBlockHeight: 12345n,
    };
    expect(isValidMiningClaimTxArgs(args)).toBe(false);
  });

  it("should reject zero block height", () => {
    const args = {
      functionName: "claim-mining-reward",
      minerBlockHeight: 0n,
    };
    expect(isValidMiningClaimTxArgs(args)).toBe(false);
  });

  it("should handle undefined", () => {
    expect(isValidMiningClaimTxArgs(undefined)).toBe(false);
  });

  it("should handle null input gracefully", () => {
    expect(isValidMiningClaimTxArgs(null)).toBe(false);
  });
});

describe("isValidStackingClaimTxArgs", () => {
  it("should validate claim-stacking-reward args", () => {
    const args = {
      functionName: "claim-stacking-reward",
      rewardCycle: 42n,
    };
    expect(isValidStackingClaimTxArgs(args)).toBe(true);
  });

  it("should validate claim with cityName", () => {
    const args = {
      functionName: "claim-stacking-reward",
      rewardCycle: 100n,
      cityName: "nyc",
    };
    expect(isValidStackingClaimTxArgs(args)).toBe(true);
  });

  it("should reject invalid function name", () => {
    const args = {
      functionName: "claim-rewards",
      rewardCycle: 42n,
    };
    expect(isValidStackingClaimTxArgs(args)).toBe(false);
  });

  it("should reject zero cycle", () => {
    const args = {
      functionName: "claim-stacking-reward",
      rewardCycle: 0n,
    };
    expect(isValidStackingClaimTxArgs(args)).toBe(false);
  });

  it("should handle undefined", () => {
    expect(isValidStackingClaimTxArgs(undefined)).toBe(false);
  });

  it("should handle null input gracefully", () => {
    expect(isValidStackingClaimTxArgs(null)).toBe(false);
  });
});

// =============================================================================
// DECODE TX ARGS TESTS
// =============================================================================

describe("decodeTxArgs", () => {
  describe("Non-contract-call transactions", () => {
    it("should return null for token transfer transactions", () => {
      const tx = {
        tx_id: "0xabc123",
        tx_type: "token_transfer",
        tx_status: "success",
      } as Transaction;
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should return null for coinbase transactions", () => {
      const tx = {
        tx_id: "0xabc123",
        tx_type: "coinbase",
        tx_status: "success",
      } as Transaction;
      expect(decodeTxArgs(tx)).toBeNull();
    });
  });

  describe("Non-CityCoins contracts", () => {
    it("should return null for unrelated contract calls", () => {
      const tx = createMockContractCallTx(
        UNRELATED_CONTRACT,
        "mine-tokens",
        [{ name: "amount", hex: toHex(uintCV(1000000)) }]
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });
  });

  describe("Legacy V1 mining transactions", () => {
    it("should decode mine-tokens with single amount", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "mine-tokens",
        [{ name: "amount", hex: toHex(uintCV(1000000)) }]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("mine-tokens");
      expect(decoded.amountsUstx).toEqual([1000000n]);
    });

    it("should decode mine-many with multiple amounts", () => {
      const amounts = [1000000n, 2000000n, 3000000n];
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "mine-many",
        [{ name: "amounts", hex: toHex(listCV(amounts.map((a) => uintCV(Number(a))))) }]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("mine-many");
      expect(decoded.amountsUstx).toEqual(amounts);
    });
  });

  describe("DAO mining transactions", () => {
    it("should decode DAO mine function with cityName", () => {
      const amounts = [500000n, 500000n];
      const tx = createMockContractCallTx(
        MIA_DAO_V2_MINING,
        "mine",
        [
          { name: "city", hex: toHex(stringAsciiCV("mia")) },
          { name: "amounts", hex: toHex(listCV(amounts.map((a) => uintCV(Number(a))))) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("mine");
      expect(decoded.cityName).toBe("mia");
      expect(decoded.amountsUstx).toEqual(amounts);
    });

    it("should decode NYC DAO mine function", () => {
      const tx = createMockContractCallTx(
        MIA_DAO_V1_MINING, // Same contract for both cities
        "mine",
        [
          { name: "city", hex: toHex(stringAsciiCV("nyc")) },
          { name: "amounts", hex: toHex(listCV([uintCV(1000000)])) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.cityName).toBe("nyc");
      expect(decoded.amountsUstx).toEqual([1000000n]);
    });
  });

  describe("Legacy stacking transactions", () => {
    it("should decode stack-tokens transaction", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V2_CORE,
        "stack-tokens",
        [
          { name: "amount", hex: toHex(uintCV(1000000000)) },
          { name: "lockPeriod", hex: toHex(uintCV(5)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("stack-tokens");
      expect(decoded.amountToken).toBe(1000000000n);
      expect(decoded.lockPeriod).toBe(5n);
    });

    it("should decode NYC stack-tokens transaction", () => {
      const tx = createMockContractCallTx(
        NYC_LEGACY_V1_CORE,
        "stack-tokens",
        [
          { name: "amount", hex: toHex(uintCV(500000000)) },
          { name: "lockPeriod", hex: toHex(uintCV(3)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("stack-tokens");
      expect(decoded.amountToken).toBe(500000000n);
      expect(decoded.lockPeriod).toBe(3n);
    });
  });

  describe("DAO stacking transactions", () => {
    it("should decode DAO stack function with cityName and 3 args", () => {
      const tx = createMockContractCallTx(
        MIA_DAO_STACKING,
        "stack",
        [
          { name: "city", hex: toHex(stringAsciiCV("mia")) },
          { name: "amount", hex: toHex(uintCV(1000000000)) },
          { name: "lockPeriod", hex: toHex(uintCV(6)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("stack");
      expect(decoded.cityName).toBe("mia");
      expect(decoded.amountToken).toBe(1000000000n);
      expect(decoded.lockPeriod).toBe(6n);
    });
  });

  describe("Mining claim transactions", () => {
    it("should decode legacy claim-mining-reward (block height only)", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "claim-mining-reward",
        [{ name: "blockHeight", hex: toHex(uintCV(50000)) }]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("claim-mining-reward");
      expect(decoded.minerBlockHeight).toBe(50000n);
    });

    it("should decode DAO claim-mining-reward with cityName", () => {
      const tx = createMockContractCallTx(
        MIA_DAO_V2_MINING,
        "claim-mining-reward",
        [
          { name: "city", hex: toHex(stringAsciiCV("mia")) },
          { name: "blockHeight", hex: toHex(uintCV(100000)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("claim-mining-reward");
      expect(decoded.cityName).toBe("mia");
      expect(decoded.minerBlockHeight).toBe(100000n);
    });
  });

  describe("Stacking claim transactions", () => {
    it("should decode legacy claim-stacking-reward (cycle only)", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "claim-stacking-reward",
        [{ name: "rewardCycle", hex: toHex(uintCV(15)) }]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("claim-stacking-reward");
      expect(decoded.rewardCycle).toBe(15n);
    });

    it("should decode DAO claim-stacking-reward from treasury contract with cityName", () => {
      const tx = createMockContractCallTx(
        MIA_DAO_TREASURY_STACKING,
        "claim-stacking-reward",
        [
          { name: "city", hex: toHex(stringAsciiCV("mia")) },
          { name: "rewardCycle", hex: toHex(uintCV(50)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("claim-stacking-reward");
      expect(decoded.cityName).toBe("mia");
      expect(decoded.rewardCycle).toBe(50n);
    });

    it("should decode NYC DAO claim-stacking-reward from treasury contract", () => {
      const tx = createMockContractCallTx(
        NYC_DAO_TREASURY_STACKING,
        "claim-stacking-reward",
        [
          { name: "city", hex: toHex(stringAsciiCV("nyc")) },
          { name: "rewardCycle", hex: toHex(uintCV(45)) },
        ]
      );
      const decoded = decodeTxArgs(tx);
      expect(decoded).not.toBeNull();
      expect(decoded.functionName).toBe("claim-stacking-reward");
      expect(decoded.rewardCycle).toBe(45n);
    });
  });

  describe("Unsupported function names", () => {
    it("should return null for unsupported function names", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "transfer",
        [{ name: "amount", hex: toHex(uintCV(1000000)) }]
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should return null for get-balance function", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "get-balance",
        []
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });
  });

  describe("Edge cases and malformed transactions", () => {
    it("should return null when required args are missing for mine-tokens", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "mine-tokens",
        [] // No args
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should return null when required args are missing for mine-many", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "mine-many",
        [] // No args
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should return null when DAO mine is missing city arg", () => {
      const tx = createMockContractCallTx(
        MIA_DAO_V2_MINING,
        "mine",
        [{ name: "amounts", hex: toHex(listCV([uintCV(1000000)])) }] // Missing city
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should return null for stack-tokens with missing lockPeriod", () => {
      const tx = createMockContractCallTx(
        MIA_LEGACY_V1_CORE,
        "stack-tokens",
        [{ name: "amount", hex: toHex(uintCV(1000000)) }] // Missing lockPeriod
      );
      expect(decodeTxArgs(tx)).toBeNull();
    });

    it("should handle empty function_args array", () => {
      const tx = createMockContractCallTx(MIA_LEGACY_V1_CORE, "claim-mining-reward", []);
      expect(decodeTxArgs(tx)).toBeNull();
    });
  });
});
