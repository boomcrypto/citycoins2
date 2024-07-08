import { useToast } from "@chakra-ui/react";
import { ClarityValue, noneCV, principalCV } from "micro-stacks/clarity";
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
  stSTXRatioAtom,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../store/ccd-012";
import { useAtom, useAtomValue } from "jotai";
import { stxAddressAtom } from "../store/stacks";
import { getStackingDaoRatio } from "../store/ccip-022";
import { useEffect } from "react";

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
  const [stSTXRatio, setStSTXRatio] = useAtom(stSTXRatioAtom);
  const { openContractCall, isRequestPending } = useOpenContractCall();

  useEffect(() => {
    const fetchSTXRatio = async () => {
      try {
        const ratio = await getStackingDaoRatio();
        setStSTXRatio(ratio);
      } catch (error) {
        console.error("Failed to fetch stSTX ratio:", error);
        setStSTXRatio(null);
      }
    };

    fetchSTXRatio();
  }, [setStSTXRatio]);

  const postConditions = buildRedemptionPostConditions(
    stxAddress,
    v1BalanceNYC,
    v2BalanceNYC,
    redemptionForBalance
  );

  if (!stxAddress || !postConditions)
    // return stub function and false for isRequestPending
    return { stackingDaoCall: () => {}, isRequestPending: false };

  // add to post conditions:
  // - xfer redemption-stx from user (to StackingDAO)
  postConditions.push(
    createSTXPostCondition(
      stxAddress,
      FungibleConditionCode.Equal,
      redemptionForBalance ?? 0
    )
  );

  // - xfer stSTX from contract (query amount from contract)
  // - stSTX token: SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
  if (stSTXRatio) {
    postConditions.push(
      createFungiblePostCondition(
        STACKING_DAO_CONTRACT_ADDRESS,
        FungibleConditionCode.Equal,
        redemptionForBalance ?? 0,
        createAssetInfo(STACKING_DAO_CONTRACT_ADDRESS, "ststx-token", "stSTX")
      )
    );
  }

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
