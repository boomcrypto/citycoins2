import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip024HasVotedAtom,
} from "../store/ccip-024";
import { useSetAtom } from "jotai";

export const useCcip024VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip024HasVoted = useSetAtom(ccip024HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-024 success!", data);
        setCcip024HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-024 popup closed!");
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
        console.log("Vote No on CCIP-024 success!", data);
        setCcip024HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-024 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
