import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  ClarityType,
  ClarityValue,
  cvToJSON,
  fetchCallReadOnlyFunction,
  OptionalCV,
  SomeCV,
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

export type Ccip026Atoms =
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

export type Ccip026VoteTotals = {
  mia: CityVoteRecord;
  nyc: CityVoteRecord;
  totals: CityVoteRecord;
};

export type Ccip026VoterInfo = {
  mia: number;
  nyc: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip026-miamicoin-burn-to-exit";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip026IsExecutableAtom = atomWithStorage(
  "citycoins-ccip026-isExecutable",
  false
);
export const ccip026IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip026-isVoteActive",
  false
);
export const ccip026VoteTotalsAtom = atomWithStorage<Ccip026VoteTotals | null>(
  "citycoins-ccip026-voteTotals",
  null
);
export const ccip026VoterInfoAtom = atomWithStorage<Ccip026VoterInfo | null>(
  "citycoins-ccip026-voterInfo",
  null
);
export const ccip026HasVotedAtom = atomWithStorage(
  "citycoins-ccip026-hasVoted",
  false
);

export const ccip026LocalStorageAtoms = [
  ccip026IsExecutableAtom,
  ccip026IsVoteActiveAtom,
  ccip026VoteTotalsAtom,
  ccip026VoterInfoAtom,
  ccip026HasVotedAtom,
];

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVotedAtom = atom((get) => {
  const voterInfo = get(ccip026VoterInfoAtom);
  const hasVoted = get(ccip026HasVotedAtom);
  if (voterInfo !== null || hasVoted) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

export const ccip026IsExecutableQueryAtom = atom(async () => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip026IsVoteActiveQueryAtom = atom(async () => {
  try {
    const isVoteActive = await getIsVoteActive();
    return isVoteActive;
  } catch (error) {
    throw new Error(
      `Failed to fetch is-vote-active for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip026VoteTotalsQueryAtom = atom(async () => {
  try {
    const voteTotals = await getVoteTotals();
    console.log(voteTotals, "voteTotals");
    return voteTotals;
  } catch (error) {
    throw new Error(
      `Failed to fetch get-vote-totals for ${CONTRACT_FQ_NAME}: ${error}`
    );
  }
});

export const ccip026VoterInfoQueryAtom = atom(async (get) => {
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

type VoteCV = TupleCV<{
  totalAmountYes: UIntCV;
  totalAmountNo: UIntCV;
  totalVotesYes: UIntCV;
  totalVotesNo: UIntCV;
}>;

async function getVoteTotals(): Promise<Ccip026VoteTotals> {
  const voteTotalsQuery = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-vote-totals",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
  })) as unknown as SomeCV<
    TupleCV<{ mia: VoteCV; totals: VoteCV }>
  >;
  return {
    mia: {
      totalAmountYes: Number(
        voteTotalsQuery.value.value.mia.value.totalAmountYes.value
      ),
      totalAmountNo: Number(
        voteTotalsQuery.value.value.mia.value.totalAmountNo.value
      ),
      totalVotesYes: Number(
        voteTotalsQuery.value.value.mia.value.totalVotesYes.value
      ),
      totalVotesNo: Number(
        voteTotalsQuery.value.value.mia.value.totalVotesNo.value
      ),
    },
    nyc: {
      totalAmountYes: 0,
      totalAmountNo: 0,
      totalVotesYes: 0,
      totalVotesNo: 0,
    },
    totals: {
      totalAmountYes: Number(
        voteTotalsQuery.value.value.totals.value.totalAmountYes.value
      ),
      totalAmountNo: Number(
        voteTotalsQuery.value.value.totals.value.totalAmountNo.value
      ),
      totalVotesYes: Number(
        voteTotalsQuery.value.value.totals.value.totalVotesYes.value
      ),
      totalVotesNo: Number(
        voteTotalsQuery.value.value.totals.value.totalVotesNo.value
      ),
    },
  } as Ccip026VoteTotals;
}

async function getVoterInfo(voterAddress: string): Promise<Ccip026VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQuery = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "ccd003-user-registry",
    functionName: "get-user-id",
    functionArgs: [standardPrincipalCV(voterAddress)],
    senderAddress: CONTRACT_ADDRESS,
  }) as UIntCV;
  const voterInfoQuery = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-voter-info",
    functionArgs: [uintCV(voterIdQuery.value)],
    senderAddress: CONTRACT_ADDRESS,
  })) as OptionalCV<TupleCV<{ mia: UIntCV; vote: boolean }>>;
  if (voterInfoQuery.type === ClarityType.OptionalNone) {
    return null;
  }
  const info = cvToJSON(voterInfoQuery.value) as { mia: number; vote: boolean };
  return { ...info, nyc: 0 } as Ccip026VoterInfo;
}
