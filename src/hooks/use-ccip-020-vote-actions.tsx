import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip020HasVotedAtom,
} from "../store/ccip-020";
import { useSetAtom } from "jotai";

export const useCcip020VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip020HasVoted = useSetAtom(ccip020HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-020 success!", data);
        setCcip020HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-020 popup closed!");
      },
    });
  };

  const voteNo = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(false)],
      onFinish: async (data) => {
        console.log("Vote No on CCIP-020 success!", data);
        setCcip020HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-020 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
