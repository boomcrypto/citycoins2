import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { standardPrincipalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip025Atoms =
  | "isExecutable"
  | "isVoteActive"
  | "voteTotals"
  | "voterInfo";

export type CityVoteRecord = {
  totalAmountYes: string;
  totalAmountNo: string;
  totalVotesYes: string;
  totalVotesNo: string;
};

export type Ccip025VoteTotals = {
  mia: CityVoteRecord;
  totals: CityVoteRecord;
};

export type Ccip025VoterInfo = {
  vote: boolean;
  mia: number;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip025-extend-sunset-period-3";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip025IsExecutableAtom = atomWithStorage(
  "citycoins-ccip025-isExecutable",
  false
);
export const ccip025IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip025-isVoteActive",
  false
);
export const ccip025VoteTotalsAtom = atomWithStorage<Ccip025VoteTotals | null>(
  "citycoins-ccip025-voteTotals",
  null
);
export const ccip025VoterInfoAtom = atomWithStorage<Ccip025VoterInfo | null>(
  "citycoins-ccip025-voterInfo",
  null
);
export const ccip025HasVotedAtom = atomWithStorage(
  "citycoins-ccip025-hasVoted",
  false
);

export const ccip025LocalStorageAtoms = [
  ccip025IsExecutableAtom,
  ccip025IsVoteActiveAtom,
  ccip025VoteTotalsAtom,
  ccip025VoterInfoAtom,
  ccip025HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip025VoterInfoAtom);
  const hasVoted = get(ccip025HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip025IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip025IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip025VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip025VoterInfoQueryAtom = atom(async (get) => {
  const stxAddress = get(stxAddressAtom);
  if (stxAddress === null) return undefined;
  try {
    const voterInfo = await getVoterInfo(stxAddress);
    return voterInfo;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-voter-info with ${stxAddress} for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

async function getIsExecutable(): Promise<boolean> {
  const isExecutableQuery = await fetchReadOnlyFunction<boolean>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-executable",
      functionArgs: [],
    },
    true
  );
  return isExecutableQuery;
}

async function getIsVoteActive(): Promise<boolean> {
  const isVoteActiveQuery = await fetchReadOnlyFunction<boolean>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-vote-active",
      functionArgs: [],
    },
    true
  );
  return isVoteActiveQuery;
}

async function getVoteTotals(): Promise<Ccip025VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip025VoteTotals>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-vote-totals",
      functionArgs: [],
    },
    true
  );
  return voteTotalsQuery;
}

async function getVoterInfo(voterAddress: string): Promise<Ccip025VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: "ccd003-user-registry",
      functionName: "get-user-id",
      functionArgs: [standardPrincipalCV(voterAddress)],
    },
    true
  );
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip025VoterInfo>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-voter-info",
      functionArgs: [uintCV(voterIdQuery)],
    },
    true
  );
  return voterInfoQuery;
}
