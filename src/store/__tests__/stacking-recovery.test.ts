import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "jotai";
import { stxAddressAtom, userIdsAtom } from "../stacks";
import {
  checkStackingRecoveryAtom,
  miaStackingRecoveryEntriesAtom,
  miaStackingRecoveryStatusAtom,
  nycStackingRecoveryEntriesAtom,
} from "../stacking-recovery";
import {
  daoGetStacker,
  legacyGetStackerAtCycle,
} from "../../utilities/contract-reads";

vi.mock("../../utilities/contract-reads", () => ({
  daoGetStacker: vi.fn(),
  legacyGetStackerAtCycle: vi.fn(),
}));

const mockDaoGetStacker = vi.mocked(daoGetStacker);
const mockLegacyGetStackerAtCycle = vi.mocked(legacyGetStackerAtCycle);

const TEST_ADDRESS = "SPP90JN2DSY4PHMKG613G3163A5VEQSN2KB2FAHP";

function setupStore(address = TEST_ADDRESS) {
  const store = createStore();
  store.set(stxAddressAtom, address);
  store.set(userIdsAtom, {
    legacy: {
      mia: { v1: 11, v2: 12 },
      nyc: { v1: 21, v2: 22 },
    },
    dao: 1,
  });
  return store;
}

describe("stacking recovery atoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLegacyGetStackerAtCycle.mockResolvedValue({
      ok: true,
      data: { amountStacked: 0, toReturn: 0 },
    });
    mockDaoGetStacker.mockResolvedValue({
      ok: true,
      data: { stacked: 0, claimable: 0 },
    });
  });

  it("creates recovery entries from final-cycle legacy toReturn and DAO claimable state", async () => {
    const store = setupStore();

    mockLegacyGetStackerAtCycle.mockImplementation(async (_city, version, _userId, cycle) => {
      return {
        ok: true,
        data: {
          amountStacked: 0,
          toReturn: version === "legacyV2" && cycle === 34 ? 208_000_000_000 : 0,
        },
      };
    });
    mockDaoGetStacker.mockImplementation(async (_city, _userId, cycle) => {
      return {
        ok: true,
        data: {
          stacked: 444_375_000_000,
          claimable: cycle === 85 ? 444_375_000_000 : 0,
        },
      };
    });

    await store.set(checkStackingRecoveryAtom, "mia");

    expect(mockLegacyGetStackerAtCycle).toHaveBeenCalledWith("mia", "legacyV1", 11, 15);
    expect(mockLegacyGetStackerAtCycle).toHaveBeenCalledWith("mia", "legacyV1", 11, 16);
    expect(mockLegacyGetStackerAtCycle).toHaveBeenCalledWith("mia", "legacyV2", 12, 33);
    expect(mockLegacyGetStackerAtCycle).toHaveBeenCalledWith("mia", "legacyV2", 12, 34);
    expect(mockDaoGetStacker).toHaveBeenCalledWith("mia", 1, 53);
    expect(mockDaoGetStacker).toHaveBeenCalledWith("mia", 1, 85);
    expect(mockDaoGetStacker).toHaveBeenCalledWith("mia", 1, 86);

    const entries = store.get(miaStackingRecoveryEntriesAtom);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => `${entry.version}-${entry.cycle}`)).toEqual([
      "legacyV2-34",
      "daoV2-85",
    ]);
    expect(entries[0]).toMatchObject({
      city: "mia",
      version: "legacyV2",
      cycle: 34,
      functionName: "claim-stacking-reward",
      status: "claimable",
      isRecovery: true,
    });
    expect(entries[0].amountTokens).toBe(208_000_000_000n);
    expect(entries[1].amountTokens).toBe(444_375_000_000n);

    expect(store.get(miaStackingRecoveryStatusAtom)).toMatchObject({
      isChecking: false,
      error: null,
    });
  });

  it("stores errors in city status without leaving stale recovery entries", async () => {
    const store = setupStore();

    mockLegacyGetStackerAtCycle.mockRejectedValue(new Error("read failed"));

    await store.set(checkStackingRecoveryAtom, "mia");

    expect(store.get(miaStackingRecoveryEntriesAtom)).toEqual([]);
    expect(store.get(miaStackingRecoveryStatusAtom)).toMatchObject({
      isChecking: false,
      error: "read failed",
    });
  });

  it("keys recovery entries by address so wallet changes hide stale results", async () => {
    const store = setupStore(TEST_ADDRESS);

    mockDaoGetStacker.mockImplementation(async (_city, _userId, cycle) => {
      return {
        ok: true,
        data: { stacked: 1, claimable: cycle === 85 ? 123_000_000 : 0 },
      };
    });

    await store.set(checkStackingRecoveryAtom, "mia");
    expect(store.get(miaStackingRecoveryEntriesAtom)).toHaveLength(1);

    store.set(stxAddressAtom, "SP2OTHERWALLET000000000000000000000000000");

    expect(store.get(miaStackingRecoveryEntriesAtom)).toEqual([]);
    expect(store.get(nycStackingRecoveryEntriesAtom)).toEqual([]);
    expect(store.get(miaStackingRecoveryStatusAtom)).toMatchObject({
      isChecking: false,
      error: null,
      checkedAt: null,
    });
  });
});
