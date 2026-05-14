import { describe, expect, it } from "vitest";
import { buildStackingClaimTx } from "../claim-transactions";
import { CITY_CONFIG } from "../../config/city-config";

describe("claim transaction builders", () => {
  describe("buildStackingClaimTx", () => {
    it("rejects cycles after the final DAO stacking cycle", () => {
      expect(() => buildStackingClaimTx("mia", "daoV2", 93)).toThrow(
        "No stacking contract handles MIA cycle 93."
      );
      expect(() => buildStackingClaimTx("nyc", "daoV2", 93)).toThrow(
        "No stacking contract handles NYC cycle 93."
      );
    });

    it("allows valid DAO v2 final-cycle claims", () => {
      const params = buildStackingClaimTx("mia", "daoV2", 83);

      expect(params.contract).toBe(CITY_CONFIG.mia.daoV2.stacking.contractId);
      expect(params.functionName).toBe("claim-stacking-reward");
      expect(params.functionArgs).toHaveLength(2);
    });

    it("normalizes shared DAO stacking claims to the cycle's DAO version", () => {
      const params = buildStackingClaimTx("mia", "daoV1", 54);

      expect(params.contract).toBe(CITY_CONFIG.mia.daoV2.stacking.contractId);
      expect(params.functionName).toBe("claim-stacking-reward");
      expect(params.functionArgs).toHaveLength(2);
    });
  });
});
