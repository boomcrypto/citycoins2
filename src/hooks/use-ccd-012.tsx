import { useToast } from "@chakra-ui/react";
import { FinishedTxData } from "micro-stacks/connect";
import { useOpenContractCall } from "@micro-stacks/react";
import {
  createAssetInfo,
  createFungiblePostCondition,
  createSTXPostCondition,
  FungibleConditionCode,
  makeContractSTXPostCondition,
  PostCondition,
} from "micro-stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  LISA_CONTRACT_ADDRESS,
  LISA_CONTRACT_NAME,
  LISA_FUNCTION_NAME,
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
    description: `View on explorer:\nhttps://explorer.hiro.so/txid/${tx.txId}?chain=mainnet`,
    status: "success",
    position: "top",
    variant: "solid",
    isClosable: true,
  });
};

const onCancelToast = (toast: any) => {
  toast({
    title: "Redemption Cancelled",
    status: "warning",
    position: "top",
    variant: "solid",
    isClosable: true,
  });
};

function buildRedemptionPostConditions(
  stxAddress: null | string,
  v1BalanceNYC: null | number,
  v2BalanceNYC: null | number,
  redemptionForBalance: null | number
) {
  if (stxAddress) {
    const postConditions: PostCondition[] = [];
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
    return postConditions;
  }
}

export const useCcd012RedeemNyc = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const redemptionForBalance = useAtomValue(redemptionForBalanceAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  // can set a state atom here for UI feedback

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );

  const contractCallParams = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "redeem-nyc",
    functionArgs: [],
    postConditions,
    onFinish: (finishedTx: FinishedTxData) => onFinishToast(finishedTx, toast),
    onCancel: () => onCancelToast(toast),
  };

  const redeemNycCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { redeemNycCall, isRequestPending };
};

export const useCcd012StackingDao = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const redemptionForBalance = useAtomValue(redemptionForBalanceAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  const functionArgs: string[] = [];
  // function args:
  // - reserve: <reserve-trait>
  // - commission: <commission-trait>
  // - staking: <staking-trait>
  // - direct-helpers: <direct-helpers-trait>
  // - referrer: (optional principal)
  // - pool: (optional principal)

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );
  // add to post conditions:
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

export const useCcd012Lisa = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const redemptionForBalance = useAtomValue(redemptionForBalanceAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  const functionArgs: string[] = [];
  // function args: (none)

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );
  // add to post conditions:
  // - xfer redemption-stx from user (to LISA)
  if (stxAddress && postConditions) {
    postConditions.push(
      createSTXPostCondition(
        stxAddress,
        FungibleConditionCode.Equal,
        redemptionForBalance ?? 0
      )
    );
  }

  const contractCallParams = {
    contractAddress: LISA_CONTRACT_ADDRESS,
    contractName: LISA_CONTRACT_NAME,
    functionName: LISA_FUNCTION_NAME,
    functionArgs: functionArgs,
    postConditions: postConditions,
    onFinish: (finishedTx: FinishedTxData) => onFinishToast(finishedTx, toast),
    onCancel: () => onCancelToast(toast),
  };

  const lisaCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { lisaCall, isRequestPending };
};
