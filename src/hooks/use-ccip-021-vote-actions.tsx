import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip021HasVotedAtom,
} from "../store/ccip-021";
import { useSetAtom } from "jotai";

export const useCcip021VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip021HasVoted = useSetAtom(ccip021HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-021 success!", data);
        setCcip021HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-021 popup closed!");
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
        console.log("Vote No on CCIP-021 success!", data);
        setCcip021HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-021 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
