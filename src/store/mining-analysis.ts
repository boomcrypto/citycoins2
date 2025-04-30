import { atom } from "jotai";
import {
  miningTransactionsAtom,
  miningClaimTransactionsAtom,
} from "./citycoins";
import { blockHeightsAtom } from "./stacks";
import { Transaction } from "@stacks/stacks-blockchain-api-types";

// Enhanced mining transaction type with extracted data
export type EnhancedMiningTransaction = {
  tx_id: string;
  block_height: number;
  sender_address: string;
  success: boolean;
  contract_id: string;
  city_name: string;
  blocks_mined: number;
  amounts: number[];
  blocks_to_claim: number[];
  claimed_status: {
    block_height: number;
    claimed: boolean;
    claim_tx_id?: string;
  }[];
};

export const enhancedMiningTransactionsAtom = atom<EnhancedMiningTransaction[]>(
  (get) => {
    const miningTxs = get(miningTransactionsAtom);
    const claimTxs = get(miningClaimTransactionsAtom);

    return miningTxs
      .filter((tx) => tx.tx_status === "success")
      .map((tx) => {
        // Extract city name and amounts from function args
        const { cityName, amounts } = extractMiningArgs(tx);

        // Calculate blocks that need to be claimed
        const blocksToClaimArray = Array.from(
          { length: amounts.length },
          (_, i) => tx.block_height + i
        );

        // Check if each block has been claimed already
        const claimedStatusArray = blocksToClaimArray.map((blockHeight) => {
          const claimTx = findClaimTransaction(
            blockHeight,
            tx.sender_address,
            cityName,
            claimTxs
          );
          return {
            block_height: blockHeight,
            claimed: claimTx !== undefined,
            claim_tx_id: claimTx?.tx_id,
          };
        });

        return {
          tx_id: tx.tx_id,
          block_height: tx.block_height,
          sender_address: tx.sender_address,
          success: tx.tx_status === "success",
          contract_id:
            tx.tx_type === "contract_call" ? tx.contract_call.contract_id : "",
          city_name: cityName,
          blocks_mined: amounts.length,
          amounts: amounts,
          blocks_to_claim: blocksToClaimArray,
          claimed_status: claimedStatusArray,
        };
      });
  }
);

// Helper function to extract city name and amounts from mining transaction
function extractMiningArgs(tx: Transaction): {
  cityName: string;
  amounts: number[];
} {
  if (tx.tx_type !== "contract_call" || !tx.contract_call.function_args) {
    return { cityName: "", amounts: [] };
  }

  let cityName = "";
  let amounts: number[] = [];

  // Extract city name
  const cityNameArg = tx.contract_call.function_args.find((arg) =>
    arg.type.includes("string")
  );

  if (cityNameArg) {
    // Remove quotes if present
    cityName = cityNameArg.repr.replace(/"/g, "");
  }

  // Extract amounts list
  const amountsArg = tx.contract_call.function_args.find(
    (arg) => arg.type.includes("list") && arg.type.includes("uint")
  );

  if (amountsArg && amountsArg.repr) {
    // Parse the list representation
    // Example: "(list u1000 u1000 u1000...)"
    const amountsStr = amountsArg.repr;

    // Extract all numbers after 'u'
    const matches = amountsStr.match(/u(\d+)/g);
    if (matches) {
      amounts = matches.map((match) => parseInt(match.substring(1), 10));
    }
  }

  return { cityName, amounts };
}

// Helper function to find a claim transaction for a specific block
function findClaimTransaction(
  blockHeight: number,
  address: string,
  cityName: string,
  claimTxs: Transaction[]
): Transaction | undefined {
  return claimTxs.find((tx) => {
    if (
      tx.tx_type !== "contract_call" ||
      tx.tx_status !== "success" ||
      tx.sender_address !== address
    ) {
      return false;
    }

    // Extract claim height and city name from the claim transaction
    const claimArgs = extractClaimArgs(tx);

    return (
      claimArgs.claimHeight === blockHeight &&
      claimArgs.cityName.toLowerCase() === cityName.toLowerCase()
    );
  });
}

// Helper function to extract claim height and city name from claim transaction
function extractClaimArgs(tx: Transaction): {
  cityName: string;
  claimHeight: number;
} {
  if (tx.tx_type !== "contract_call" || !tx.contract_call.function_args) {
    return { cityName: "", claimHeight: 0 };
  }

  let cityName = "";
  let claimHeight = 0;

  // Extract city name
  const cityNameArg = tx.contract_call.function_args.find((arg) =>
    arg.type.includes("string")
  );

  if (cityNameArg) {
    cityName = cityNameArg.repr.replace(/"/g, "");
  }

  // Extract claim height
  const heightArg = tx.contract_call.function_args.find((arg) =>
    arg.type.includes("uint")
  );

  if (heightArg) {
    // Parse the uint representation
    // Example: "u107577"
    const heightStr = heightArg.repr;
    if (heightStr.startsWith("u")) {
      claimHeight = parseInt(heightStr.substring(1), 10);
    } else {
      claimHeight = parseInt(heightStr, 10);
    }
  }

  return { cityName, claimHeight };
}

// Type for unclaimed rewards
export type UnclaimedReward = {
  tx_id: string;
  sender_address: string;
  contract_id: string;
  city_name: string;
  block_height: number;
  amount: number;
  maturity_height: number;
  is_mature: boolean;
};

// Atom for unclaimed rewards
export const unclaimedMiningRewardsAtom = atom<UnclaimedReward[]>((get) => {
  const enhancedMiningTxs = get(enhancedMiningTransactionsAtom);
  const blockHeights = get(blockHeightsAtom);
  const currentBlockHeight = blockHeights?.stx || 0;
  const rewardDelay = 100; // This should come from the contract, hardcoded for now

  // Flatten all blocks that need to be claimed and haven't been claimed yet
  const unclaimedBlocks = enhancedMiningTxs.flatMap((tx) => {
    return tx.claimed_status
      .filter((status) => !status.claimed)
      .map((status, index) => {
        const maturityHeight = status.block_height + rewardDelay;
        return {
          tx_id: tx.tx_id,
          sender_address: tx.sender_address,
          contract_id: tx.contract_id,
          city_name: tx.city_name,
          block_height: status.block_height,
          amount: tx.amounts[index],
          maturity_height: maturityHeight,
          is_mature: currentBlockHeight >= maturityHeight,
        };
      });
  });

  // Sort by block height
  return unclaimedBlocks.sort((a, b) => a.block_height - b.block_height);
});
