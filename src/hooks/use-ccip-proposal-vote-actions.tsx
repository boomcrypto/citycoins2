import { openContractCall } from "@stacks/connect";
import { boolCV, PostConditionMode } from "@stacks/transactions";
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
            await openContractCall({
                contractAddress: config.contractAddress,
                contractName: config.contractName,
                functionName: "vote-on-proposal",
                functionArgs: [boolCV(true)],
                postConditionMode: PostConditionMode.Deny,
                onFinish: (data) => {
                    console.log("Vote Yes transaction submitted:", data.txId);
                    setHasVoted(true);
                },
                onCancel: () => {
                    console.log("Vote Yes transaction cancelled");
                },
            });
        } catch (error) {
            console.error(`Error voting Yes on ${config.contractName}:`, error);
        }
    };

    const voteNo = async () => {
        try {
            await openContractCall({
                contractAddress: config.contractAddress,
                contractName: config.contractName,
                functionName: "vote-on-proposal",
                functionArgs: [boolCV(false)],
                postConditionMode: PostConditionMode.Deny,
                onFinish: (data) => {
                    console.log("Vote No transaction submitted:", data.txId);
                    setHasVoted(true);
                },
                onCancel: () => {
                    console.log("Vote No transaction cancelled");
                },
            });
        } catch (error) {
            console.error(`Error voting No on ${config.contractName}:`, error);
        }
    };

    return { voteYes, voteNo };
};