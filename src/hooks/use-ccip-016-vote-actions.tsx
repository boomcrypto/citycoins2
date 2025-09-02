import { request } from "@stacks/connect";
import { boolCV, PostConditionMode } from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip016HasVotedAtom,
} from "../store/ccip-016";
import { useSetAtom } from "jotai";

export const useCcip016VoteActions = () => {
  const setCcip016HasVoted = useSetAtom(ccip016HasVotedAtom);

  const voteYes = async () => {
    try {
      await request("stx_callContract", {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: "vote-on-proposal",
        functionArgs: [boolCV(true)],
      });
      setCcip016HasVoted(true);
    } catch (error) {
      console.error("Error voting Yes on CCIP-016:", error);
    }
  };

  const voteNo = async () => {
    try {
      await request("stx_callContract", {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: "vote-on-proposal",
        functionArgs: [boolCV(false)],
      });
      setCcip016HasVoted(true);
    } catch (error) {
      console.error("Error voting No on CCIP-016:", error);
    }
  };

  return { voteYes, voteNo };
};
