import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip025HasVotedAtom,
} from "../store/ccip-025";
import { useSetAtom } from "jotai";

export const useCcip025VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip025HasVoted = useSetAtom(ccip025HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-025 success!", data);
        setCcip025HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-025 popup closed!");
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
        console.log("Vote No on CCIP-025 success!", data);
        setCcip025HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-025 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
