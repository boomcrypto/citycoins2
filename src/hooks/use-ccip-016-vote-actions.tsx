import { useOpenContractCall } from "@micro-stacks/react";
import { boolCV } from "micro-stacks/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip016HasVotedAtom,
} from "../store/ccip-016";
import { useSetAtom } from "jotai";

export const useCcip016VoteActions = () => {
  const { openContractCall, isRequestPending } = useOpenContractCall();
  const setCcip016HasVoted = useSetAtom(ccip016HasVotedAtom);

  const voteYes = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal", // TODO: Verify function name for CCIP-016 contract
      functionArgs: [boolCV(true)],
      onFinish: async (data) => {
        console.log("Vote Yes on CCIP-016 success!", data);
        setCcip016HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote Yes on CCIP-016 popup closed!");
      },
    });
  };

  const voteNo = async () => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "vote-on-proposal", // TODO: Verify function name for CCIP-016 contract
      functionArgs: [boolCV(false)],
      onFinish: async (data) => {
        console.log("Vote No on CCIP-016 success!", data);
        setCcip016HasVoted(true);
      },
      onCancel: () => {
        console.log("Vote No on CCIP-016 popup closed!");
      },
    });
  };

  return { voteYes, voteNo, isRequestPending };
};
