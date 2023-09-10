import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchReadOnlyFunction } from "micro-stacks/api";
import { validateStacksAddress } from "micro-stacks/crypto";
import { uintCV } from "micro-stacks/clarity";

/////////////////////////
// TYPES
/////////////////////////

export type Ccip017VoteTotals = {
  noTotal: number;
  yesTotal: number;
  noVotes: number;
  yesVotes: number;
};

export type Ccip017VoterInfo = {
  mia: number;
  nyc: number;
  total: number;
  vote: boolean;
};

/////////////////////////
// CONSTANTS
/////////////////////////

export const CONTRACT_ADDRESS = "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH";
export const CONTRACT_NAME = "ccip017-extend-sunset-period";
export const CONTRACT_FQ_NAME = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/////////////////////////
// LOCALSTORAGE ATOMS
/////////////////////////

export const ccip017IsExecutableAtom = atomWithStorage(
  "citycoins-ccip017-isExecutable",
  false
);
export const ccip017IsVoteActiveAtom = atomWithStorage(
  "citycoins-ccip017-isVoteActive",
  false
);
export const ccip017VoteTotalsAtom = atomWithStorage<Ccip017VoteTotals | null>(
  "citycoins-ccip017-voteTotals",
  null
);
export const ccip017VoterInfoAtom = atomWithStorage<Ccip017VoterInfo | null>(
  "citycoins-ccip017-voterInfo",
  null
);

/////////////////////////
// DERIVED ATOMS
/////////////////////////

export const hasVoted = atom((get) => {
  const voterInfo = get(ccip017VoterInfoAtom);
  if (voterInfo) {
    return true;
  }
  return false;
});

/////////////////////////
// LOADABLE ASYNC ATOMS
/////////////////////////

// atom for is-executable
// atom for is-vote-active
// atom for get-vote-totals
// atom for get-voter-info

export const ccip017IsExecutableQueryAtom = atom(async (get) => {
  try {
    const isExecutable = await getIsExecutable();
    return isExecutable;
  } catch (error) {
    console.error(
      `Failed to fetch is-executable for ${CONTRACT_FQ_NAME}:`,
      error
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

async function getVoteTotals(): Promise<Ccip017VoteTotals> {
  const voteTotalsQuery = await fetchReadOnlyFunction<Ccip017VoteTotals>(
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

async function getVoterInfo(voterAddress: string): Promise<Ccip017VoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQuery = await fetchReadOnlyFunction<number>(
    {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-voter-id",
      functionArgs: [voterAddress],
    },
    true
  );
  const voterInfoQuery = await fetchReadOnlyFunction<Ccip017VoterInfo>(
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
