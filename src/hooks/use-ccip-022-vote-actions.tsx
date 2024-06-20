import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip022HasVotedAtom,
} from "../store/ccip-022";
import { useSetAtom } from "jotai";

export const useCcip022VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip022HasVoted = useSetAtom(ccip022HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-022 success!", data);
        setCcip022HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-022 popup closed!");
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
        console.log("Vote No on CCIP-022 success!", data);
        setCcip022HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-022 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
