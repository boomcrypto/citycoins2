import { useToast } from "@chakra-ui/react";
import { useOpenContractCall } from "@micro-stacks/react";
import { stringAsciiCV, uintCV } from "micro-stacks/clarity";
import { FinishedTxData } from "micro-stacks/connect";
import { UnclaimedReward } from "../store/mining-analysis";
import { atom, useSetAtom } from "jotai";

// Atom to store the latest claim transaction ID
export const miningClaimTxIdAtom = atom<string | null>(null);

// Toast helper functions
const onFinishToast = (tx: FinishedTxData, toast: any) => {
  toast({
    title: "Mining Claim TX Sent",
    description: `View on explorer:\nhttps://explorer.hiro.so/txid/${tx.txId}?chain=mainnet`,
    status: "success",
    position: "top",
    variant: "solid",
    isClosable: true,
    duration: 9000,
  });
  return tx.txId;
};

const onCancelToast = (toast: any) => {
  toast({
    title: "Mining Claim Cancelled",
    status: "warning",
    position: "top",
    variant: "solid",
    isClosable: true,
  });
};

export const useMiningClaims = () => {
  const toast = useToast();
  const setTxId = useSetAtom(miningClaimTxIdAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  const claimMiningReward = async (reward: UnclaimedReward) => {
    if (!reward.is_mature) {
      toast({
        title: "Cannot Claim Immature Reward",
        description: `Block ${reward.block_height} is not yet mature. It will be claimable at block ${reward.maturity_height}.`,
        status: "error",
        position: "top",
        variant: "solid",
        isClosable: true,
      });
      return;
    }

    // Split contract ID into address and name
    const [contractAddress, contractName] = reward.contract_id.split('.');

    const contractCallParams = {
      contractAddress,
      contractName,
      functionName: "claim-mining-reward",
      functionArgs: [
        stringAsciiCV(reward.city_name),
        uintCV(reward.block_height)
      ],
      postConditions: [],
      onFinish: (finishedTx: FinishedTxData) => {
        const txId = onFinishToast(finishedTx, toast);
        setTxId(txId);
      },
      onCancel: () => onCancelToast(toast),
    };

    await openContractCall(contractCallParams);
  };

  return { claimMiningReward, isRequestPending };
};
