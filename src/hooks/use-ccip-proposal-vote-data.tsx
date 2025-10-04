import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import {
    CcipProposalAtoms,
    CcipProposalConfig,
    createCcipProposalAtoms,
} from "../store/ccip-proposal";
import { LoadableDataset, extractLoadableState } from "../store/common";

export const useCcipProposalVoteData = (
    config: CcipProposalConfig,
    selector: CcipProposalAtoms
): LoadableDataset<any> => {
    const proposalAtoms = createCcipProposalAtoms(config);

    const isExecutableLoader = loadable(proposalAtoms.isExecutableQueryAtom);
    const isVoteActiveLoader = loadable(proposalAtoms.isVoteActiveQueryAtom);
    const voteTotalsLoader = loadable(proposalAtoms.voteTotalsQueryAtom);
    const voterInfoLoader = loadable(proposalAtoms.voterInfoQueryAtom);
    const hasVotedLoader = loadable(proposalAtoms.hasVotedDerivedAtom);

    const isExecutable = extractLoadableState(
        useAtom(isExecutableLoader)[0]
    );
    const isVoteActive = extractLoadableState(
        useAtom(isVoteActiveLoader)[0]
    );
    const voteTotals = extractLoadableState(useAtom(voteTotalsLoader)[0]);
    const voterInfo = extractLoadableState(useAtom(voterInfoLoader)[0]);
    const hasVoted = extractLoadableState(useAtom(hasVotedLoader)[0])

    switch (selector) {
        case "isExecutable":
            return isExecutable;
        case "isVoteActive":
            return isVoteActive;
        case "voteTotals":
            return voteTotals;
        case "voterInfo":
            return voterInfo;
        case "hasVoted":
            return hasVoted
    }
};