import { useToast } from "@chakra-ui/react";
import { useOpenContractCall } from "@micro-stacks/react";
import { CONTRACT_ADDRESS, CONTRACT_NAME } from "../store/ccd-012";

export const useCcd012RedeemNyc = () => {
  const toast = useToast();
  const { openContractCall, isRequestPending } = useOpenContractCall();

  // can set a state atom here for UI feedback

  const contractCallParams = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "redeem-nyc",
    functionArgs: [],
    onFinish: () => toast({ title: "Redemption TX Sent", status: "success" }),
    onCancel: () => toast({ title: "Redemption Cancelled", status: "warning" }),
  };

  const redeemNycCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { redeemNycCall, isRequestPending };
};
