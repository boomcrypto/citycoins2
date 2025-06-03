import { useAtomValue, useSetAtom } from "jotai";
import { useToast } from "@chakra-ui/react";
import {
  ClarityValue,
  FungibleConditionCode,
  noneCV,
  Pc,
  PostCondition,
  principalCV,
} from "@stacks/transactions";
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
  ccd012TxIdAtom,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../store/ccd-012";
import { stxAddressAtom } from "../store/stacks";
import { request } from "@stacks/connect";
import { CallContractParams, TransactionResult } from "@stacks/connect/dist/types/methods";

const onFinishToast = (tx: TransactionResult, toast: any) => {
  toast({
    title: "Redemption TX Sent",
    description: `View on explorer:\nhttps://explorer.hiro.so/txid/${tx.txid}?chain=mainnet`,
    status: "success",
    position: "top",
    variant: "solid",
    isClosable: true,
    duration: 9000,
  });
  return tx.txid || null;
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
        Pc.principal(stxAddress)
          .willSendEq(v1BalanceNYC)
          .ft(
            `${NYC_V1_CONTRACT_ADDRESS}.${NYC_V1_CONTRACT_NAME}`,
            NYC_ASSET_NAME
          )
      );
    }
    // add v2 post condition if needed
    if (v2BalanceNYC !== null && v2BalanceNYC > 0) {
      postConditions.push(
        Pc.principal(stxAddress)
          .willSendEq(v2BalanceNYC)
          .ft(
            `${NYC_V2_CONTRACT_ADDRESS}.${NYC_V2_CONTRACT_NAME}`,
            NYC_ASSET_NAME
          )
      );
    }
    // add redemption for balance from contract
    if (redemptionForBalance !== null && redemptionForBalance > 0) {
      postConditions.push(
        Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendEq(redemptionForBalance)
          .ustx()
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
  const setTxId = useSetAtom(ccd012TxIdAtom);

  // can set a state atom here for UI feedback

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );

  const contractCallParams: CallContractParams = {
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    functionName: "redeem-nyc",
    functionArgs: [],
    postConditions,
  };

  const redeemNycCall = async () => {
    try {
      const finishedTx = await request("stx_callContract",
        contractCallParams
      );
      const txId = onFinishToast(finishedTx, toast);
      setTxId(txId);
    } catch (error) {
      onCancelToast(toast);
    }
  };

  return { redeemNycCall };
};

export const useCcd012StackingDao = () => {
  const toast = useToast();
  const stxAddress = useAtomValue(stxAddressAtom);
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const redemptionForBalance = useAtomValue(redemptionForBalanceAtom);
  const setTxId = useSetAtom(ccd012TxIdAtom);

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );

  if (!stxAddress || !postConditions)
    // return stub function and false for isRequestPending
    return { stackingDaoCall: () => { }, isRequestPending: false };

  // add to post conditions:
  // - xfer redemption-stx from user (to StackingDAO)
  postConditions.push(
    Pc.principal(stxAddress)
      .willSendEq(redemptionForBalance ?? 0)
      .ustx()
  );

  /*

  NOT NECESSARY - stSTX is minted, no post condition needed
  
  // - xfer stSTX from contract (query amount from contract)
  // - stSTX token: SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
  // console.log("stSTXRatio", stSTXRatio);
  if (stSTXRatio) {
    const stSTXRatioDecimal = stSTXRatio / MICRO(6); // 1.023801
    const stMicroSTXAmount = (redemptionForBalance ?? 0) * stSTXRatioDecimal;
    const stMicroSTXAmountRounded = Math.round(stMicroSTXAmount);

    // console.log("stSTXRatioDecimal", stSTXRatioDecimal);
    // console.log("stMicroSTXAmount", stMicroSTXAmount);
    // console.log("stMicroSTXAmountRounded", stMicroSTXAmountRounded);
    // console.log("stSTXAmount", stMicroSTXAmountRounded / MICRO(6));

    postConditions.push(
      createFungiblePostCondition(
        STACKING_DAO_CONTRACT_ADDRESS,
        FungibleConditionCode.Equal,
        stMicroSTXAmountRounded,
        createAssetInfo(STACKING_DAO_CONTRACT_ADDRESS, "ststx-token", "stSTX")
      )
    );
  }

  */

  // function args based on a test tx from the UI:
  const functionArgs: ClarityValue[] = [];
  // - reserve: reserve-v1
  functionArgs.push(principalCV(`${STACKING_DAO_CONTRACT_ADDRESS}.reserve-v1`));
  // - commission: commission-v2
  functionArgs.push(
    principalCV(`${STACKING_DAO_CONTRACT_ADDRESS}.commission-v2`)
  );
  // - staking: staking-v0
  functionArgs.push(principalCV(`${STACKING_DAO_CONTRACT_ADDRESS}.staking-v0`));
  // - direct-helpers: direct-helpers-v1
  functionArgs.push(
    principalCV(`${STACKING_DAO_CONTRACT_ADDRESS}.direct-helpers-v1`)
  );
  // - referrer: none
  functionArgs.push(noneCV());
  // - pool: none
  functionArgs.push(noneCV());

  const contractCallParams = {
    contractAddress: STACKING_DAO_CONTRACT_ADDRESS,
    contractName: STACKING_DAO_CONTRACT_NAME,
    functionName: STACKING_DAO_FUNCTION_NAME,
    functionArgs: functionArgs,
    postConditions: postConditions,
    onFinish: (finishedTx: FinishedTxData) => {
      const txId = onFinishToast(finishedTx, toast);
      setTxId(txId);
    },
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
  const setTxId = useSetAtom(ccd012TxIdAtom);
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
    onFinish: (finishedTx: FinishedTxData) => {
      const txId = onFinishToast(finishedTx, toast);
      setTxId(txId);
    },
    onCancel: () => onCancelToast(toast),
  };

  const lisaCall = async () => {
    await openContractCall(contractCallParams);
  };

  return { lisaCall, isRequestPending };
};
