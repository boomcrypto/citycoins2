import { ClarityValue, deserializeCV } from "@stacks/transactions";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { decodeClarityValues, safeConvertToBigint } from "./clarity";
import { Buffer } from "buffer";

export interface MiningTxArgs {
  functionName: "mine-tokens" | "mine-many" | "mine"; // Covers variations
  amountsUstx: bigint[]; // Array for multi-block (e.g., mine-many); single for mine-tokens
  // Other args like memo if present
}

export interface StackingTxArgs {
  functionName: "stack-tokens" | "stack";
  amountToken: bigint;
  lockPeriod: number; // Number of cycles to lock for
}

export interface MiningClaimTxArgs {
  functionName: "claim-mining-reward";
  minerBlockHeight: number;
}

export interface StackingClaimTxArgs {
  functionName: "claim-stacking-reward";
  rewardCycle: number;
}

// Type guard examples
export function isValidMiningTxArgs(decoded: any): decoded is MiningTxArgs {
  return (
    typeof decoded === "object" &&
    (decoded.functionName === "mine-tokens" ||
      decoded.functionName === "mine-many" ||
      decoded.functionName === "mine") &&
    Array.isArray(decoded.amountsUstx) &&
    decoded.amountsUstx.every((amt) => typeof amt === "bigint" && amt > 0n) // Basic validation: positive bigints
  );
}

export function isValidStackingTxArgs(decoded: any): decoded is StackingTxArgs {
  return (
    typeof decoded === "object" &&
    (decoded.functionName === "stack-tokens" ||
      decoded.functionName === "stack") &&
    typeof decoded.amountToken === "bigint" &&
    decoded.amountToken > 0n &&
    typeof decoded.lockPeriod === "number" &&
    decoded.lockPeriod > 0
  );
}

export function isValidMiningClaimTxArgs(
  decoded: any
): decoded is MiningClaimTxArgs {
  return (
    typeof decoded === "object" &&
    decoded.functionName === "claim-mining-reward" &&
    typeof decoded.minerBlockHeight === "number" &&
    decoded.minerBlockHeight > 0
  );
}

export function isValidStackingClaimTxArgs(
  decoded: any
): decoded is StackingClaimTxArgs {
  return (
    typeof decoded === "object" &&
    decoded.functionName === "claim-stacking-reward" &&
    typeof decoded.rewardCycle === "number" &&
    decoded.rewardCycle > 0
  );
}

export function decodeTxArgs(tx: Transaction): any | null {
  if (tx.tx_type !== "contract_call") return null;
  const rawArgs = tx.contract_call.function_args || [];
  const decodedArgs = rawArgs.map((arg) => {
    const cv: ClarityValue = deserializeCV(Buffer.from(arg.hex, "hex"));
    return decodeClarityValues(cv);
  });

  // Reconstruct object with arg names if available, or by known order
  const structured: any = { functionName: tx.contract_call.function_name };

  // For simplicity, map by known function signatures (expand as needed)
  switch (tx.contract_call.function_name) {
    case "mine-many":
    case "mine-tokens":
      // Assuming first arg is list of uint (amounts)
      structured.amountsUstx = decodedArgs[0].map((val: any) =>
        safeConvertToBigint(val)
      );
      break;
    case "mine":
      // Assuming single uint amount
      structured.amountsUstx = [safeConvertToBigint(decodedArgs[0])];
      break;
    case "stack-tokens":
    case "stack":
      // Assuming amountToken (uint), lockPeriod (uint)
      structured.amountToken = safeConvertToBigint(decodedArgs[0]);
      structured.lockPeriod = Number(decodedArgs[1]);
      break;
    case "claim-mining-reward":
      // Assuming minerBlockHeight (uint)
      structured.minerBlockHeight = Number(decodedArgs[0]);
      break;
    case "claim-stacking-reward":
      // Assuming rewardCycle (uint)
      structured.rewardCycle = Number(decodedArgs[0]);
      break;
    default:
      return null;
  }

  return structured;
}
