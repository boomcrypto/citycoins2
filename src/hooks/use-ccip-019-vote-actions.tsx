import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip019HasVotedAtom,
} from "../store/ccip-019";
import { useSetAtom } from "jotai";

export const useCcip019VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip019HasVoted = useSetAtom(ccip019HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-019 success!", data);
        setCcip019HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-019 popup closed!");
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
        console.log("Vote No on CCIP-019 success!", data);
        setCcip019HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-019 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
