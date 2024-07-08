import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { standardPrincipalCV, uintCV } from "micro-stacks/clarity";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip022Atoms =
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

export type Ccip022VoteTotals = {
  nyc: CityVoteRecord;
  totals: CityVoteRecord;
};

export type Ccip022VoterInfo = {
  nyc: number;
  total: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip022-treasury-redemption-nyc";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip022IsExecutableAtom = atomWithStorage(
  "citycoins-ccip022-isExecutable",
  false
);
export const ccip022IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip022-isVoteActive",
  false
);
export const ccip022VoteTotalsAtom = atomWithStorage<Ccip022VoteTotals | null>(
  "citycoins-ccip022-voteTotals",
  null
);
export const ccip022VoterInfoAtom = atomWithStorage<Ccip022VoterInfo | null>(
  "citycoins-ccip022-voterInfo",
  null
);
export const ccip022HasVotedAtom = atomWithStorage(
  "citycoins-ccip022-hasVoted",
  false
);

export const ccip022LocalStorageAtoms = [
  ccip022IsExecutableAtom,
  ccip022IsVoteActiveAtom,
  ccip022VoteTotalsAtom,
  ccip022VoterInfoAtom,
  ccip022HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip022VoterInfoAtom);
  const hasVoted = get(ccip022HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip022IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip022IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip022VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip022VoterInfoQueryAtom = atom(async (get) => {
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

async function getVoteTotals(): Promise<Ccip022VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip022VoteTotals>(
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

async function getVoterInfo(voterAddress: string): Promise<Ccip022VoterInfo> {
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
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip022VoterInfo>(
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
