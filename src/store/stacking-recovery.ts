import { atom } from "jotai";
import {
  CityName,
  Version,
  VERSIONS,
  CITY_CONFIG,
} from "../config/city-config";
import { stxAddressAtom, userIdsAtom } from "./stacks";
import { StackingEntry } from "./claims";
import { getUserIdForVersion } from "../utilities/claim-verification";
import {
  daoGetStacker,
  legacyGetStackerAtCycle,
} from "../utilities/contract-reads";

export interface StackingRecoveryEntry extends StackingEntry {
  isRecovery: true;
}

export interface StackingRecoveryStatus {
  isChecking: boolean;
  error: string | null;
  checkedAt: number | null;
}

type RecoveryEntriesByCity = Record<CityName, StackingRecoveryEntry[]>;
type RecoveryStatusByCity = Record<CityName, StackingRecoveryStatus>;

interface RecoveryEntriesState {
  address: string | null;
  entries: RecoveryEntriesByCity;
}

interface RecoveryStatusState {
  address: string | null;
  statuses: RecoveryStatusByCity;
}

const emptyEntries: RecoveryEntriesByCity = {
  mia: [],
  nyc: [],
};

const emptyStatus = (): StackingRecoveryStatus => ({
  isChecking: false,
  error: null,
  checkedAt: null,
});

const emptyStatuses: RecoveryStatusByCity = {
  mia: emptyStatus(),
  nyc: emptyStatus(),
};

const stackingRecoveryEntriesAtom = atom<RecoveryEntriesState>({
  address: null,
  entries: emptyEntries,
});
const stackingRecoveryStatusAtom = atom<RecoveryStatusState>({
  address: null,
  statuses: emptyStatuses,
});

function isLegacyVersion(version: Version): version is "legacyV1" | "legacyV2" {
  return version === "legacyV1" || version === "legacyV2";
}

function isDaoVersion(version: Version): version is "daoV1" | "daoV2" {
  return version === "daoV1" || version === "daoV2";
}

function createRecoveryEntry(
  city: CityName,
  version: Version,
  cycle: number,
  amountTokens: number
): StackingRecoveryEntry {
  const contractId = CITY_CONFIG[city][version].stacking.contractId;

  return {
    txId: `recovery-${city}-${version}-${cycle}`,
    cycle,
    city,
    version,
    contractId,
    functionName: "claim-stacking-reward",
    amountTokens: BigInt(amountTokens),
    status: "claimable",
    isRecovery: true,
  };
}

function getRecoveryCandidateCycles(endCycle: number): number[] {
  const cycles = endCycle > 1 ? [endCycle - 1, endCycle] : [endCycle];
  return Array.from(new Set(cycles));
}

async function getRecoverableAmount(
  city: CityName,
  version: Version,
  userId: number,
  cycle: number
): Promise<number> {
  if (isLegacyVersion(version)) {
    const result = await legacyGetStackerAtCycle(city, version, userId, cycle);
    if (!result.ok) {
      throw new Error(result.error || "Failed to check legacy stacking recovery");
    }
    return result.data?.toReturn ?? 0;
  }

  if (isDaoVersion(version)) {
    const result = await daoGetStacker(city, userId, cycle);
    if (!result.ok) {
      throw new Error(result.error || "Failed to check DAO stacking recovery");
    }
    return result.data?.claimable ?? 0;
  }

  return 0;
}

export const miaStackingRecoveryEntriesAtom = atom((get) => {
  const address = get(stxAddressAtom);
  const state = get(stackingRecoveryEntriesAtom);
  return state.address === address ? state.entries.mia : [];
});

export const nycStackingRecoveryEntriesAtom = atom((get) => {
  const address = get(stxAddressAtom);
  const state = get(stackingRecoveryEntriesAtom);
  return state.address === address ? state.entries.nyc : [];
});

export const miaStackingRecoveryStatusAtom = atom((get) => {
  const address = get(stxAddressAtom);
  const state = get(stackingRecoveryStatusAtom);
  return state.address === address ? state.statuses.mia : emptyStatus();
});

export const nycStackingRecoveryStatusAtom = atom((get) => {
  const address = get(stxAddressAtom);
  const state = get(stackingRecoveryStatusAtom);
  return state.address === address ? state.statuses.nyc : emptyStatus();
});

export const checkStackingRecoveryAtom = atom(
  null,
  async (get, set, city: CityName) => {
    const address = get(stxAddressAtom);
    const userIds = get(userIdsAtom);
    if (!address || !userIds) return;

    const currentStatusState = get(stackingRecoveryStatusAtom);
    const currentStatuses =
      currentStatusState.address === address ? currentStatusState.statuses : emptyStatuses;
    set(stackingRecoveryStatusAtom, {
      address,
      statuses: {
        ...currentStatuses,
        [city]: { isChecking: true, error: null, checkedAt: null },
      },
    });

    try {
      const entries: StackingRecoveryEntry[] = [];

      for (const version of VERSIONS) {
        const endCycle = CITY_CONFIG[city][version].stacking.endCycle;
        if (endCycle === undefined) continue;

        const userId = getUserIdForVersion(userIds, city, version);
        if (userId === null) continue;

        for (const cycle of getRecoveryCandidateCycles(endCycle)) {
          const recoverableAmount = await getRecoverableAmount(
            city,
            version,
            userId,
            cycle
          );

          if (recoverableAmount > 0) {
            entries.push(createRecoveryEntry(city, version, cycle, recoverableAmount));
          }
        }
      }

      const currentEntryState = get(stackingRecoveryEntriesAtom);
      const currentEntries =
        currentEntryState.address === address ? currentEntryState.entries : emptyEntries;
      set(stackingRecoveryEntriesAtom, {
        address,
        entries: {
          ...currentEntries,
          [city]: entries,
        },
      });

      const latestStatusState = get(stackingRecoveryStatusAtom);
      const latestStatuses =
        latestStatusState.address === address ? latestStatusState.statuses : emptyStatuses;
      set(stackingRecoveryStatusAtom, {
        address,
        statuses: {
          ...latestStatuses,
          [city]: { isChecking: false, error: null, checkedAt: Date.now() },
        },
      });
    } catch (error) {
      const latestStatusState = get(stackingRecoveryStatusAtom);
      const latestStatuses =
        latestStatusState.address === address ? latestStatusState.statuses : emptyStatuses;
      set(stackingRecoveryStatusAtom, {
        address,
        statuses: {
          ...latestStatuses,
          [city]: {
            isChecking: false,
            error: error instanceof Error ? error.message : String(error),
            checkedAt: Date.now(),
          },
        },
      });
    }
  }
);
