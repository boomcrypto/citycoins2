import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { standardPrincipalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

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

// TODO: Update with actual CCIP-016 contract address and name
export const CONTRACT_ADDRESS = "SP000000000000000000002Q6VF78";
export const CONTRACT_NAME = "ccip016-vote-contract";
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

async function getVoteTotals(): Promise<Ccip016VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip016VoteTotals>(
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

async function getVoterInfo(voterAddress: string): Promise<Ccip016VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  // Assuming CCIP-016 voting contract uses ccd003-user-registry like CCIP-017
  // TODO: Verify this assumption for the actual CCIP-016 voting contract
  const voterIdQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: CONTRACT_ADDRESS, // Or the specific user-registry if different
      contractName: "ccd003-user-registry",
      functionName: "get-user-id",
      functionArgs: [standardPrincipalCV(voterAddress)],
    },
    true
  );
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip016VoterInfo>(
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
