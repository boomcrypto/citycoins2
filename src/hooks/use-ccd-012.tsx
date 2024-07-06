import { useToast } from "@chakra-ui/react";
import { useOpenContractCall } from "@micro-stacks/react";
import {
  createAssetInfo,
  createFungiblePostCondition,
  FungibleConditionCode,
  makeContractSTXPostCondition,
} from "micro-stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  NYC_ASSET_NAME,
  NYC_V1_CONTRACT_ADDRESS,
  NYC_V1_CONTRACT_NAME,
  NYC_V2_CONTRACT_ADDRESS,
  NYC_V2_CONTRACT_NAME,
  redemptionForBalanceAtom,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../store/ccd-012";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../store/stacks";

export const useCcd012RedeemNyc = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const redemptionForBalance = useAtomValue(redemptionForBalanceAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  // can set a state atom here for UI feedback

  const postConditions = [];

  if (stxAddress) {
    // add v1 post condition if needed
    if (v1BalanceNYC !== null && v1BalanceNYC > 0) {
      postConditions.push(
        createFungiblePostCondition(
          stxAddress,
          FungibleConditionCode.Equal,
          v1BalanceNYC,
          createAssetInfo(
            NYC_V1_CONTRACT_ADDRESS,
            NYC_V1_CONTRACT_NAME,
            NYC_ASSET_NAME
          )
        )
      );
    }
    // add v2 post condition if needed
    if (v2BalanceNYC !== null && v2BalanceNYC > 0) {
      postConditions.push(
        createFungiblePostCondition(
          stxAddress,
          FungibleConditionCode.Equal,
          v2BalanceNYC,
          createAssetInfo(
            NYC_V2_CONTRACT_ADDRESS,
            NYC_V2_CONTRACT_NAME,
            NYC_ASSET_NAME
          )
        )
      );
    }
    // add redemption for balance from contract
    if (redemptionForBalance !== null && redemptionForBalance > 0) {
      postConditions.push(
        makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Equal,
          redemptionForBalance
        )
      );
    }
  }

  const contractCallParams = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "redeem-nyc",
    functionArgs: [],
    postConditions,
    onFinish: () => toast({ title: "Redemption TX Sent", status: "success" }),
    onCancel: () => toast({ title: "Redemption Cancelled", status: "warning" }),
  };

  const redeemNycCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { redeemNycCall, isRequestPending };
};
