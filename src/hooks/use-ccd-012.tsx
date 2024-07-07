import { useToast } from "@chakra-ui/react";
import { FinishedTxData } from "micro-stacks/connect";
import { ClarityValue } from "micro-stacks/clarity";
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
  STACKING_DAO_CONTRACT_ADDRESS,
  STACKING_DAO_CONTRACT_NAME,
  STACKING_DAO_FUNCTION_NAME,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../store/ccd-012";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../store/stacks";

const onFinishToast = (tx: FinishedTxData, toast: any) => {
  toast({
    title: "Redemption TX Sent",
    status: "success",
    description: `View on explorer:\nhttps://explorer.hiro.so/txid/${tx.txId}?chain=mainnet`,
  });
};

const onCancelToast = (toast: any) => {
  toast({ title: "Redemption Cancelled", status: "warning" });
};

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

export const useCcd012StackingDao = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  const functionArgs: string[] = [];
  // function args:
  // - reserve: <reserve-trait>
  // - commission: <commission-trait>
  // - staking: <staking-trait>
  // - direct-helpers: <direct-helpers-trait>
  // - referrer: (optional principal)
  // - pool: (optional principal)

  const postConditions: string[] = [];
  // post conditions:
  // - burn nyc v1 (balance from user)
  // - burn nyc v2 (balance from user)
  // - xfer redemption-stx from contract (to user)
  // - xfer redemption-stx from user (to StackingDAO)
  // - xfer stSTX from contract (query amount)

  const contractCallParams = {
    contractAddress: STACKING_DAO_CONTRACT_ADDRESS,
    contractName: STACKING_DAO_CONTRACT_NAME,
    functionName: STACKING_DAO_FUNCTION_NAME,
    functionArgs: functionArgs,
    postConditions: postConditions,
    onFinish: (finishedTx: FinishedTxData) => onFinishToast(finishedTx, toast),
    onCancel: () => onCancelToast(toast),
  };

  const stackingDaoCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { stackingDaoCall, isRequestPending };
};
