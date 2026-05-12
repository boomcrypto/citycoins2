import { describe, expect, it } from "vitest";
import {
  buildMiaRedeemPostConditions,
  mapCcd013RedemptionInfo,
  mapCcd013UserRedemptionInfo,
  MIA_REWARDS_TREASURY,
} from "../contract-reads/ccd013-redemption";

describe("ccd013 redemption helpers", () => {
  it("maps global redemption info while preserving bigint values", () => {
    const mapped = mapCcd013RedemptionInfo({
      "redemption-enabled": true,
      "block-height": "7754807",
      "total-supply": "123456789000000",
      "mining-treasury-ustx": "987654321000000",
      "current-contract-balance": "456000000",
      "redemption-ratio": "789",
      "total-redeemed": "1000000",
      "total-transferred": "500000",
    });

    expect(mapped.redemptionEnabled).toBe(true);
    expect(mapped.blockHeight).toBe(7754807n);
    expect(mapped.totalSupply).toBe(123456789000000n);
    expect(mapped.miningTreasuryUstx).toBe(987654321000000n);
  });

  it("maps user preview balances, burn split, and expected STX", () => {
    const mapped = mapCcd013UserRedemptionInfo({
      address: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      "mia-balances": {
        "balance-v1-mia": "10",
        "balance-v2-umia": "1500000",
        "total-balance-umia": "11500000",
      },
      "redemption-amount-ustx": "2300",
      "burn-amount-umia": "11500000",
      "burn-amount-v1-mia": "10",
      "burn-amount-v2-umia": "1500000",
      "redemption-claims": { umia: "0", ustx: "0" },
    });

    expect(mapped.balanceV1Mia).toBe(10n);
    expect(mapped.balanceV2Umia).toBe(1500000n);
    expect(mapped.totalBalanceUmia).toBe(11500000n);
    expect(mapped.burnAmountV1Mia).toBe(10n);
    expect(mapped.burnAmountV2Umia).toBe(1500000n);
    expect(mapped.redemptionAmountUstx).toBe(2300n);
  });

  it("builds strict post-conditions for mixed v1/v2 redemption", () => {
    const pcs = buildMiaRedeemPostConditions({
      userAddress: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      burnAmountV1Mia: 10n,
      burnAmountV2Umia: 1500000n,
      redemptionAmountUstx: 2300n,
    });

    expect(pcs).toHaveLength(3);
    expect(pcs[0]).toMatchObject({
      type: "ft-postcondition",
      address: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      condition: "lte",
      amount: "10",
      asset: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token::miamicoin",
    });
    expect(pcs[1]).toMatchObject({
      type: "ft-postcondition",
      address: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      condition: "lte",
      amount: "1500000",
      asset: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2::miamicoin",
    });
    expect(pcs[2]).toMatchObject({
      type: "stx-postcondition",
      address: MIA_REWARDS_TREASURY,
      condition: "gte",
      amount: "2300",
    });
  });

  it("omits zero-token burn post-conditions while keeping STX guarantee", () => {
    const pcs = buildMiaRedeemPostConditions({
      userAddress: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
      burnAmountV1Mia: 0n,
      burnAmountV2Umia: 0n,
      redemptionAmountUstx: 1n,
    });

    expect(pcs).toHaveLength(1);
    expect(pcs[0]).toMatchObject({
      type: "stx-postcondition",
      address: MIA_REWARDS_TREASURY,
      condition: "gte",
      amount: "1",
    });
  });
});
