import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  ClarityType,
  ClarityValue,
  cvToJSON,
  fetchCallReadOnlyFunction,
  standardPrincipalCV,
  TupleCV,
  TupleData,
  UIntCV,
  uintCV,
  validateStacksAddress,
} from "@stacks/transactions";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip016Atoms =
  | "isExecutable"
  | "isVoteActive"
  | "voteTotals"
  | "voterInfo";

export type CityVoteRecord = {
  totalAmountYes: number;
  totalAmountNo: number;
  totalVotesYes: number;
  totalVotesNo: number;
};

export type Ccip016VoteTotals = {
  mia: CityVoteRecord;
  nyc: CityVoteRecord;
  totals: CityVoteRecord;
};

export type Ccip016VoterInfo = {
  mia: number;
  nyc: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
export const CONTRACT_NAME = "ccip016-missed-payouts";
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
  const isExecutableQuery = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "is-executable",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  });
  return isExecutableQuery.type === ClarityType.BoolTrue;
}

async function getIsVoteActive(): Promise<boolean> {
  const isVoteActiveQuery = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "is-vote-active",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  });
  return isVoteActiveQuery.type === ClarityType.BoolTrue;
}

async function getVoteTotals(): Promise<Ccip016VoteTotals> {
  const voteTotalsQuery = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-vote-totals",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  })) as unknown as TupleCV<{ mia: UIntCV; nyc: UIntCV; totals: UIntCV }>;
  return cvToJSON(voteTotalsQuery) as Ccip016VoteTotals;
}

async function getVoterInfo(voterAddress: string): Promise<Ccip016VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQuery = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "ccd003-user-registry",
    functionName: "get-user-id",
    functionArgs: [standardPrincipalCV(voterAddress)],
    senderAddress: CONTRACT_ADDRESS,
  });
  const voterInfoQuery = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-voter-info",
    functionArgs: [voterIdQuery],
    senderAddress: CONTRACT_ADDRESS,
  })) as unknown as TupleCV<{ mia: UIntCV; nyc: UIntCV; totals: UIntCV }>;
  return cvToJSON(voterInfoQuery) as Ccip016VoterInfo;
}
