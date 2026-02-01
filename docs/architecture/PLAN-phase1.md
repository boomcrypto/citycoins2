# Phase 1: Fix Critical Bugs in Validation and Cycle Calculation

<plan>
  <goal>Fix 3 bugs that cause incorrect behavior or crashes: null input validation, empty array validation, and getCycleFirstBlock startCycle offset.</goal>

  <context>
    The audit found these bugs during testing:
    1. All validation functions (isValidMiningTxArgs, etc.) throw TypeError on null input because typeof null === "object" passes the first check, then null.functionName throws
    2. isValidMiningTxArgs accepts empty amountsUstx arrays because JS [].every() returns true for empty arrays
    3. getCycleFirstBlock ignores the startCycle parameter, causing wrong block calculations for legacyV2 (startCycle=17) and DAO versions (startCycle=54)

    Current test expectations confirm these bugs:
    - transactions.test.ts lines 174-178, 232-234, 275-277, 317-320: "should throw on null"
    - transactions.test.ts lines 136-143: documents empty array being accepted
    - claims.test.ts lines 144-146: notes the getCycleFirstBlock issue

    Formula fix for getCycleFirstBlock:
    - Current: genesisBlock + (cycle - 1) * cycleLength
    - Correct: genesisBlock + (cycle - startCycle) * cycleLength
  </context>

  <task id="1">
    <name>Fix null input validation in transaction utilities</name>
    <files>/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/transactions.ts</files>
    <action>
      Add explicit null check at the start of each validation function.

      For isValidMiningTxArgs (lines 42-51):
      Change:
      ```typescript
      export function isValidMiningTxArgs(decoded: any): decoded is MiningTxArgs {
        return (
          typeof decoded === "object" &&
      ```
      To:
      ```typescript
      export function isValidMiningTxArgs(decoded: any): decoded is MiningTxArgs {
        if (decoded === null || decoded === undefined) return false;
        return (
          typeof decoded === "object" &&
      ```

      Apply the same pattern to:
      - isValidStackingTxArgs (lines 53-62)
      - isValidMiningClaimTxArgs (lines 64-73)
      - isValidStackingClaimTxArgs (lines 75-84)
    </action>
    <verify>
      Run: npm test -- --run src/utilities/__tests__/transactions.test.ts
      Expected: Tests will fail because they expect throws - this is expected until task 2 updates tests
    </verify>
    <done>All four validation functions return false for null/undefined input instead of throwing</done>
  </task>

  <task id="2">
    <name>Fix empty array validation and update tests</name>
    <files>/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/transactions.ts, /home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/utilities/__tests__/transactions.test.ts</files>
    <action>
      Part A - Fix empty array validation in transactions.ts:

      In isValidMiningTxArgs, add array length check (around line 48):
      Change:
      ```typescript
      Array.isArray(decoded.amountsUstx) &&
      decoded.amountsUstx.every((amt: any) => typeof amt === "bigint" && amt > 0n)
      ```
      To:
      ```typescript
      Array.isArray(decoded.amountsUstx) &&
      decoded.amountsUstx.length > 0 &&
      decoded.amountsUstx.every((amt: any) => typeof amt === "bigint" && amt > 0n)
      ```

      Part B - Update tests in transactions.test.ts:

      1. Change test at line 174-178 from "should throw on null" to "should return false on null":
      ```typescript
      it("should return false on null", () => {
        expect(isValidMiningTxArgs(null)).toBe(false);
      });
      ```

      2. Change test at line 136-143 to expect false for empty arrays:
      ```typescript
      it("should reject empty amounts array", () => {
        const args = {
          functionName: "mine-tokens",
          amountsUstx: [],
        };
        expect(isValidMiningTxArgs(args)).toBe(false);
      });
      ```

      3. Change test at line 232-234:
      ```typescript
      it("should return false on null", () => {
        expect(isValidStackingTxArgs(null)).toBe(false);
      });
      ```

      4. Change test at line 275-277:
      ```typescript
      it("should return false on null", () => {
        expect(isValidMiningClaimTxArgs(null)).toBe(false);
      });
      ```

      5. Change test at line 317-320:
      ```typescript
      it("should return false on null", () => {
        expect(isValidStackingClaimTxArgs(null)).toBe(false);
      });
      ```
    </action>
    <verify>
      Run: npm test -- --run src/utilities/__tests__/transactions.test.ts
      Expected: All 51 tests pass
    </verify>
    <done>Empty array validation rejects empty arrays; all null tests expect false instead of throw</done>
  </task>

  <task id="3">
    <name>Fix getCycleFirstBlock startCycle offset and add tests</name>
    <files>/home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/config/city-config.ts, /home/whoabuddy/dev/boomcrypto/citycoins-ui-v2/src/store/__tests__/claims.test.ts</files>
    <action>
      Part A - Fix getCycleFirstBlock in city-config.ts (lines 601-604):

      Change:
      ```typescript
      export function getCycleFirstBlock(city: CityName, version: Version, cycle: number): number {
        const { genesisBlock, cycleLength } = CITY_CONFIG[city][version].stacking;
        return genesisBlock + (cycle - 1) * cycleLength;
      }
      ```
      To:
      ```typescript
      export function getCycleFirstBlock(city: CityName, version: Version, cycle: number): number {
        const { genesisBlock, cycleLength, startCycle } = CITY_CONFIG[city][version].stacking;
        return genesisBlock + (cycle - startCycle) * cycleLength;
      }
      ```

      Part B - Add tests in claims.test.ts after the existing getBlockCycle tests (around line 214):

      Add new describe block:
      ```typescript
      describe("getCycleFirstBlock", () => {
        it("should calculate correct first block for MIA legacyV1 cycle 1", () => {
          // MIA legacyV1: genesis 24497, startCycle 1
          // Cycle 1 first block = 24497 + (1-1) * 2100 = 24497
          expect(getCycleFirstBlock("mia", "legacyV1", 1)).toBe(24497);
        });

        it("should calculate correct first block for MIA legacyV1 cycle 2", () => {
          // Cycle 2 first block = 24497 + (2-1) * 2100 = 26597
          expect(getCycleFirstBlock("mia", "legacyV1", 2)).toBe(26597);
        });

        it("should calculate correct first block for MIA legacyV2 cycle 17 (genesis)", () => {
          // MIA legacyV2: genesis 58921, startCycle 17
          // Cycle 17 first block = 58921 + (17-17) * 2100 = 58921
          expect(getCycleFirstBlock("mia", "legacyV2", 17)).toBe(58921);
        });

        it("should calculate correct first block for MIA legacyV2 cycle 18", () => {
          // Cycle 18 first block = 58921 + (18-17) * 2100 = 61021
          expect(getCycleFirstBlock("mia", "legacyV2", 18)).toBe(61021);
        });

        it("should calculate correct first block for DAO V2 cycle 54 (genesis)", () => {
          // DAO V2: genesis 107389, startCycle 54
          // Cycle 54 first block = 107389 + (54-54) * 2100 = 107389
          expect(getCycleFirstBlock("mia", "daoV2", 54)).toBe(107389);
        });

        it("should calculate correct first block for DAO V2 cycle 55", () => {
          // Cycle 55 first block = 107389 + (55-54) * 2100 = 109489
          expect(getCycleFirstBlock("mia", "daoV2", 55)).toBe(109489);
        });

        it("should calculate correct first block for NYC legacyV1", () => {
          // NYC legacyV1: genesis 37449, startCycle 1
          expect(getCycleFirstBlock("nyc", "legacyV1", 1)).toBe(37449);
          expect(getCycleFirstBlock("nyc", "legacyV1", 2)).toBe(39549);
        });
      });
      ```

      Also add import for getCycleFirstBlock at the top of the test file (around line 28):
      ```typescript
      import {
        isMiningClaimEligible,
        isStackingClaimEligible,
        getBlockCycle,
        getCycleFirstBlock,
        MINING_CLAIM_MATURITY,
      } from "../../config/city-config";
      ```
    </action>
    <verify>
      Run: npm test -- --run src/store/__tests__/claims.test.ts
      Expected: All tests pass including new getCycleFirstBlock tests

      Run: npm test -- --run
      Expected: All 110+ tests pass (51 transaction + 59 claims + new tests)
    </verify>
    <done>getCycleFirstBlock correctly uses startCycle offset; tests verify legacyV2 and DAO versions work correctly</done>
  </task>
</plan>
