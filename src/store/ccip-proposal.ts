import {
  ClarityType,
  cvToJSON,
  fetchCallReadOnlyFunction,
  SomeCV,
  standardPrincipalCV,
  TupleCV,
  UIntCV,
  validateStacksAddress,
} from "@stacks/transactions";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { stxAddressAtom } from "./stacks";

/////////////////////////
// TYPES
/////////////////////////

export type CcipProposalAtoms =
  | "isExecutable"
  | "isVoteActive"
  | "voteTotals"
  | "voterInfo"
  | "hasVoted";

export type CityVoteRecord = {
  totalAmountYes: number;
  totalAmountNo: number;
  totalVotesYes: number;
  totalVotesNo: number;
};

export type CcipProposalVoteTotals = {
  mia: CityVoteRecord;
  nyc: CityVoteRecord;
  totals: CityVoteRecord;
};

export type CcipProposalVoterInfo = {
  mia: number;
  nyc: number;
  vote: boolean;
};

export type CcipProposalConfig = {
  contractAddress: string;
  contractName: string;
  storagePrefix: string;
};

/////////////////////////
// PROPOSAL CONFIGURATIONS
/////////////////////////

export const CCIP_016_CONFIG: CcipProposalConfig = {
  contractAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  contractName: "ccip016-missed-payouts-v3",
  storagePrefix: "citycoins-ccip016",
};

export const CCIP_026_CONFIG: CcipProposalConfig = {
  contractAddress: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
  contractName: "ccip026-miamicoin-burn-to-exit",
  storagePrefix: "citycoins-ccip026",
};

/////////////////////////
// FACTORY FUNCTIONS FOR ATOMS
/////////////////////////

export function createCcipProposalAtoms(config: CcipProposalConfig) {
  const contractFqName = `${config.contractAddress}.${config.contractName}`;

  const isExecutableAtom = atomWithStorage(
    `${config.storagePrefix}-isExecutable`,
    false
  );

  const isVoteActiveAtom = atomWithStorage(
    `${config.storagePrefix}-isVoteActive`,
    false
  );

  const voteTotalsAtom = atomWithStorage<CcipProposalVoteTotals | null>(
    `${config.storagePrefix}-voteTotals`,
    null
  );

  const voterInfoAtom = atomWithStorage<CcipProposalVoterInfo | null>(
    `${config.storagePrefix}-voterInfo`,
    null
  );

  const hasVotedAtom = atomWithStorage(
    `${config.storagePrefix}-hasVoted`,
    false
  );

  const localStorageAtoms = [
    isExecutableAtom,
    isVoteActiveAtom,
    voteTotalsAtom,
    voterInfoAtom,
    hasVotedAtom,
  ];

  /////////////////////////
  // DERIVED ATOMS
  /////////////////////////

  const hasVotedDerivedAtom = atom((get) => {
    const voterInfo = get(voterInfoAtom);
    const hasVoted = get(hasVotedAtom);
    if (voterInfo !== null || hasVoted) {
      return true;
    }
    return false;
  });

  /////////////////////////
  // LOADABLE ASYNC ATOMS
  /////////////////////////

  const isExecutableQueryAtom = atom(async () => {
    try {
      const isExecutable = await getIsExecutable(config);
      return isExecutable;
    } catch (error) {
      throw new Error(
        `Failed to fetch is-executable for ${contractFqName}: ${error}`
      );
    }
  });

  const isVoteActiveQueryAtom = atom(async () => {
    try {
      const isVoteActive = await getIsVoteActive(config);
      return isVoteActive;
    } catch (error) {
      throw new Error(
        `Failed to fetch is-vote-active for ${contractFqName}: ${error}`
      );
    }
  });

  const voteTotalsQueryAtom = atom(async () => {
    try {
      const voteTotals = await getVoteTotals(config);
      console.log(voteTotals, "voteTotals");
      return voteTotals;
    } catch (error) {
      throw new Error(
        `Failed to fetch get-vote-totals for ${contractFqName}: ${error}`
      );
    }
  });

  const voterInfoQueryAtom = atom(async (get) => {
    const stxAddress = get(stxAddressAtom);
    if (stxAddress === null) return undefined;
    try {
      const voterInfo = await getVoterInfo(config, stxAddress);
      return voterInfo;
    } catch (error) {
      throw new Error(
        `Failed to fetch get-voter-info with ${stxAddress} for ${contractFqName}: ${error}`
      );
    }
  });

  return {
    // Storage atoms
    isExecutableAtom,
    isVoteActiveAtom,
    voteTotalsAtom,
    voterInfoAtom,
    hasVotedAtom,
    localStorageAtoms,
    // Derived atoms
    hasVotedDerivedAtom,
    // Query atoms
    isExecutableQueryAtom,
    isVoteActiveQueryAtom,
    voteTotalsQueryAtom,
    voterInfoQueryAtom,
    // Config
    config,
    contractFqName,
  };
}

/////////////////////////
// CCIP-016 SPECIFIC ATOMS (for backwards compatibility)
/////////////////////////

export const ccip016Atoms = createCcipProposalAtoms(CCIP_016_CONFIG);

// Export individual atoms for backwards compatibility
export const ccip016IsExecutableAtom = ccip016Atoms.isExecutableAtom;
export const ccip016IsVoteActiveAtom = ccip016Atoms.isVoteActiveAtom;
export const ccip016VoteTotalsAtom = ccip016Atoms.voteTotalsAtom;
export const ccip016VoterInfoAtom = ccip016Atoms.voterInfoAtom;
export const ccip016HasVotedAtom = ccip016Atoms.hasVotedAtom;
export const ccip016LocalStorageAtoms = ccip016Atoms.localStorageAtoms;
export const hasVotedAtom = ccip016Atoms.hasVotedDerivedAtom;
export const ccip016IsExecutableQueryAtom = ccip016Atoms.isExecutableQueryAtom;
export const ccip016IsVoteActiveQueryAtom = ccip016Atoms.isVoteActiveQueryAtom;
export const ccip016VoteTotalsQueryAtom = ccip016Atoms.voteTotalsQueryAtom;
export const ccip016VoterInfoQueryAtom = ccip016Atoms.voterInfoQueryAtom;

// Legacy type exports for backwards compatibility
export type Ccip016VoteTotals = CcipProposalVoteTotals;
export type Ccip016VoterInfo = CcipProposalVoterInfo;
export type Ccip016Atoms = CcipProposalAtoms;

/////////////////////////
// CCIP-026 SPECIFIC ATOMS
/////////////////////////

export const ccip026Atoms = createCcipProposalAtoms(CCIP_026_CONFIG);

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

async function getIsExecutable(config: CcipProposalConfig): Promise<boolean> {
  const isExecutableQuery = await fetchCallReadOnlyFunction({
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    functionName: "is-executable",
    functionArgs: [],
    senderAddress: config.contractAddress,
  });
  return isExecutableQuery.type === ClarityType.BoolTrue;
}

async function getIsVoteActive(config: CcipProposalConfig): Promise<boolean> {
  const isVoteActiveQuery = await fetchCallReadOnlyFunction({
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    functionName: "is-vote-active",
    functionArgs: [],
    senderAddress: config.contractAddress,
  });
  return isVoteActiveQuery.type === ClarityType.BoolTrue;
}

type VoteCV = TupleCV<{
  totalAmountYes: UIntCV;
  totalAmountNo: UIntCV;
  totalVotesYes: UIntCV;
  totalVotesNo: UIntCV;
}>;

async function getVoteTotals(
  config: CcipProposalConfig
): Promise<CcipProposalVoteTotals> {
  const voteTotalsQuery = (await fetchCallReadOnlyFunction({
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    functionName: "get-vote-totals",
    functionArgs: [],
    senderAddress: config.contractAddress,
  })) as unknown as SomeCV<
    TupleCV<{ mia: VoteCV; nyc: VoteCV; totals: VoteCV }>
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
      totalAmountYes: Number(
        voteTotalsQuery.value.value.nyc.value.totalAmountYes.value
      ),
      totalAmountNo: Number(
        voteTotalsQuery.value.value.nyc.value.totalAmountNo.value
      ),
      totalVotesYes: Number(
        voteTotalsQuery.value.value.nyc.value.totalVotesYes.value
      ),
      totalVotesNo: Number(
        voteTotalsQuery.value.value.nyc.value.totalVotesNo.value
      ),
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
  } as CcipProposalVoteTotals;
}

async function getVoterInfo(
  config: CcipProposalConfig,
  voterAddress: string
): Promise<CcipProposalVoterInfo> {
  if (!validateStacksAddress(voterAddress)) {
    throw new Error("Invalid STX address");
  }
  const voterIdQuery = await fetchCallReadOnlyFunction({
    contractAddress: config.contractAddress,
    contractName: "ccd003-user-registry",
    functionName: "get-user-id",
    functionArgs: [standardPrincipalCV(voterAddress)],
    senderAddress: config.contractAddress,
  });
  const voterInfoQuery = (await fetchCallReadOnlyFunction({
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    functionName: "get-voter-info",
    functionArgs: [voterIdQuery],
    senderAddress: config.contractAddress,
  })) as unknown as TupleCV<{ mia: UIntCV; nyc: UIntCV; totals: UIntCV }>;
  return cvToJSON(voterInfoQuery) as CcipProposalVoterInfo;
}
