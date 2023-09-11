import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip017HasVotedAtom,
} from "../store/ccip-017";
import { useSetAtom } from "jotai";

export const useCcip017VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip017HasVoted = useSetAtom(ccip017HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal",
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-017 success!", data);
        setCcip017HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-017 popup closed!");
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
        console.log("Vote No on CCIP-017 success!", data);
        setCcip017HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-017 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
