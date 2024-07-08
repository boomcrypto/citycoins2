import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { standardPrincipalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip021Atoms =
  | "isExecutable"
  | "isVoteActive"
  | "voteTotals"
  | "voterInfo";

export type Ccip021VoteTotals = {
  noTotal: number;
  yesTotal: number;
  noVotes: number;
  yesVotes: number;
};

export type Ccip021VoterInfo = {
  mia: number;
  nyc: number;
  total: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip021-extend-sunset-period-2";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip021IsExecutableAtom = atomWithStorage(
  "citycoins-ccip021-isExecutable",
  false
);
export const ccip021IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip021-isVoteActive",
  false
);
export const ccip021VoteTotalsAtom = atomWithStorage<Ccip021VoteTotals | null>(
  "citycoins-ccip021-voteTotals",
  null
);
export const ccip021VoterInfoAtom = atomWithStorage<Ccip021VoterInfo | null>(
  "citycoins-ccip021-voterInfo",
  null
);
export const ccip021HasVotedAtom = atomWithStorage(
  "citycoins-ccip021-hasVoted",
  false
);

export const ccip021LocalStorageAtoms = [
  ccip021IsExecutableAtom,
  ccip021IsVoteActiveAtom,
  ccip021VoteTotalsAtom,
  ccip021VoterInfoAtom,
  ccip021HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip021VoterInfoAtom);
  const hasVoted = get(ccip021HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip021IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip021IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip021VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip021VoterInfoQueryAtom = atom(async (get) => {
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

async function getVoteTotals(): Promise<Ccip021VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip021VoteTotals>(
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

async function getVoterInfo(voterAddress: string): Promise<Ccip021VoterInfo> {
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
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip021VoterInfo>(
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
