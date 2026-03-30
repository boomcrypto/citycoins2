import { request } from "@stacks/connect";
import { boolCV } from "@stacks/transactions";
import { useSetAtom } from "jotai";
import {
    CcipProposalConfig,
    createCcipProposalAtoms,
} from "../store/ccip-proposal";

export const useCcipProposalVoteActions = (config: CcipProposalConfig) => {
    const proposalAtoms = createCcipProposalAtoms(config);
    const setHasVoted = useSetAtom(proposalAtoms.hasVotedAtom);

    const voteYes = async () => {
        try {
            await request("stx_callContract", {
                contract: `${config.contractAddress}.${config.contractName}`,
                functionName: "vote-on-proposal",
                functionArgs: [boolCV(true)],
            });
            console.log("Vote Yes transaction submitted");
            setHasVoted(true);
        } catch (error) {
            console.error(`Error voting Yes on ${config.contractName}:`, error);
        }
    };

    const voteNo = async () => {
        try {
            await request("stx_callContract", {
                contract: `${config.contractAddress}.${config.contractName}`,
                functionName: "vote-on-proposal",
                functionArgs: [boolCV(false)],
            });
            console.log("Vote No transaction submitted");
            setHasVoted(true);
        } catch (error) {
            console.error(`Error voting No on ${config.contractName}:`, error);
        }
    };

    return { voteYes, voteNo };
};