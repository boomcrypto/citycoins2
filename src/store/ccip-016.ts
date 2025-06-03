import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { stxAddressAtom } from "./stacks";
import {
  Cl,
  ClarityType,
  ClarityValue,
  cvToValue,
  fetchCallReadOnlyFunction,
  principalCV,
} from "@stacks/transactions";

// helper function for tuples
function convertClarityTuple<T>(clarityValue: ClarityValue): T {
  if (clarityValue.type !== ClarityType.Tuple) {
    throw new Error(
      `Invalid format: expected tuple, got ${
        clarityValue.type
      }. Value: ${JSON.stringify(clarityValue)}`
    );
  }
  const tupleValue = clarityValue.value;
  return Object.fromEntries(
    Object.entries(tupleValue).map(([key, value]) => [
      key,
      cvToValue(value as ClarityValue),
    ])
  ) as T;
}

/////////////////////////
// TYPES
/////////////////////////

export type Ccip016Atoms =
  | "isExecutable"
  | "isVoteActive"
  | "voteTotals"
  | "voterInfo";

export type Ccip016VoteTotals = {
  noTotal: number;
  yesTotal: number;
  noVotes: number;
  yesVotes: number;
};

export type Ccip016VoterInfo = {
  mia: number;
  nyc: number;
  total: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
export const CONTRACT_NAME = "ccip016-missed-payouts-v3";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip016IsExecutableAtom = atomWithStorage(
  "citycoins-ccip016-isExecutable",
  false
);
export const ccip016IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip016-isVoteActive",
  false
);
export const ccip016VoteTotalsAtom = atomWithStorage<Ccip016VoteTotals | null>(
  "citycoins-ccip016-voteTotals",
  null
);
export const ccip016VoterInfoAtom = atomWithStorage<Ccip016VoterInfo | null>(
  "citycoins-ccip016-voterInfo",
  null
);
export const ccip016HasVotedAtom = atomWithStorage(
  "citycoins-ccip016-hasVoted",
  false
);

export const ccip016LocalStorageAtoms = [
  ccip016IsExecutableAtom,
  ccip016IsVoteActiveAtom,
  ccip016VoteTotalsAtom,
  ccip016VoterInfoAtom,
  ccip016HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip016VoterInfoAtom);
  const hasVoted = get(ccip016HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip016IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip016IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip016VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip016VoterInfoQueryAtom = atom(async (get) => {
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
  const isExecutableQueryCV = await fetchCallReadOnlyFunction({
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "is-executable",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  });
  if (
    isExecutableQueryCV.type !== ClarityType.BoolFalse &&
    isExecutableQueryCV.type !== ClarityType.BoolTrue
  ) {
    throw new Error(
      `Unexpected return type for is-executable: ${isExecutableQueryCV.type}`
    );
  }
  const isExecutableQuery = cvToValue(isExecutableQueryCV) as boolean;
  return isExecutableQuery;
}

async function getIsVoteActive(): Promise<boolean> {
  const isVoteActiveQueryCV = await fetchCallReadOnlyFunction({
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "is-vote-active",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  });
  if (
    isVoteActiveQueryCV.type !== ClarityType.BoolFalse &&
    isVoteActiveQueryCV.type !== ClarityType.BoolTrue
  ) {
    throw new Error(
      `Unexpected return type for is-vote-active: ${isVoteActiveQueryCV.type}`
    );
  }
  const isVoteActiveQuery = cvToValue(isVoteActiveQueryCV) as boolean;
  return isVoteActiveQuery;
}

async function getVoteTotals(): Promise<Ccip016VoteTotals> {
  const voteTotalsQueryCV = await fetchCallReadOnlyFunction({
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "get-vote-totals",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  });
  const voteTotalsQuery =
    convertClarityTuple<Ccip016VoteTotals>(voteTotalsQueryCV);
  return voteTotalsQuery;
}

async function getVoterInfo(voterAddress: string): Promise<Ccip016VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQueryCV = await fetchCallReadOnlyFunction({
    contractName: "ccd003-user-registry",
    contractAddress: CONTRACT_ADDRESS,
    functionName: "get-user-id",
    functionArgs: [principalCV(voterAddress)],
    senderAddress: CONTRACT_ADDRESS,
  });
  if (voterIdQueryCV.type !== ClarityType.UInt) {
    throw new Error(
      `Unexpected return type for get-user-id: ${voterIdQueryCV.type}`
    );
  }
  const voterInfoQueryCV = await fetchCallReadOnlyFunction({
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "get-voter-info",
    functionArgs: [voterIdQueryCV],
    senderAddress: CONTRACT_ADDRESS,
  });
  if (voterInfoQueryCV.type !== ClarityType.Tuple) {
    throw new Error(
      `Unexpected return type for get-voter-info: ${voterInfoQueryCV.type}`
    );
  }
  const voterInfoQuery =
    convertClarityTuple<Ccip016VoterInfo>(voterInfoQueryCV);
  return voterInfoQuery;
}
