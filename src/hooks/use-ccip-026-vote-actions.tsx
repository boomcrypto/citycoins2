import { request } from "@stacks/connect";
import { boolCV, PostConditionMode } from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  ccip026HasVotedAtom,
} from "../store/ccip-026";
import { useSetAtom } from "jotai";

export const useCcip026VoteActions = () => {
  const setCcip026HasVoted = useSetAtom(ccip026HasVotedAtom);

  const voteYes = async () => {
    try {
      await request("stx_callContract", {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: "vote-on-proposal",
        functionArgs: [boolCV(true)],
      });
      setCcip026HasVoted(true);
    } catch (error) {
      console.error("Error voting Yes on CCIP-026:", error);
    }
  };

  const voteNo = async () => {
    try {
      await request("stx_callContract", {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: "vote-on-proposal",
        functionArgs: [boolCV(false)],
      });
      setCcip026HasVoted(true);
    } catch (error) {
      console.error("Error voting No on CCIP-026:", error);
    }
  };

  return { voteYes, voteNo };
};
