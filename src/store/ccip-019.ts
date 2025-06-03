import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { standardPrincipalCV, uintCV } from "@stacks/transactions";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip019Atoms =
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

export type Ccip019VoteTotals = {
  mia: CityVoteRecord;
  totals: CityVoteRecord;
};

export type Ccip019VoterInfo = {
  mia: number;
  total: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip019-pox-4-stacking";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip019IsExecutableAtom = atomWithStorage(
  "citycoins-ccip019-isExecutable",
  false
);
export const ccip019IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip019-isVoteActive",
  false
);
export const ccip019VoteTotalsAtom = atomWithStorage<Ccip019VoteTotals | null>(
  "citycoins-ccip019-voteTotals",
  null
);
export const ccip019VoterInfoAtom = atomWithStorage<Ccip019VoterInfo | null>(
  "citycoins-ccip019-voterInfo",
  null
);
export const ccip019HasVotedAtom = atomWithStorage(
  "citycoins-ccip019-hasVoted",
  false
);

export const ccip019LocalStorageAtoms = [
  ccip019IsExecutableAtom,
  ccip019IsVoteActiveAtom,
  ccip019VoteTotalsAtom,
  ccip019VoterInfoAtom,
  ccip019HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip019VoterInfoAtom);
  const hasVoted = get(ccip019HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip019IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip019IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip019VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip019VoterInfoQueryAtom = atom(async (get) => {
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

async function getVoteTotals(): Promise<Ccip019VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip019VoteTotals>(
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

async function getVoterInfo(voterAddress: string): Promise<Ccip019VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  // console.log("Voter Address", voterAddress);
  const voterIdQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: "ccd003-user-registry",
      functionName: "get-user-id",
      functionArgs: [standardPrincipalCV(voterAddress)],
    },
    true
  );
  // console.log("Voter ID", voterIdQuery);
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip019VoterInfo>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-voter-info",
      functionArgs: [uintCV(voterIdQuery)],
    },
    true
  );
  // console.log("Voter Info", voterInfoQuery);
  return voterInfoQuery;
}
