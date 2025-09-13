import { ClarityValue, deserializeCV } from "@stacks/transactions";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { decodeClarityValues, safeConvertToBigint } from "./clarity";
import { Buffer } from "buffer";

export interface MiningTxArgs {
  functionName: "mine-tokens" | "mine-many"; // Covers variations
  amountsUstx: bigint[]; // Array for multi-block (e.g., mine-many); single for mine-tokens
  // Other args like memo if present
}

export interface StackingTxArgs {
  functionName: "stack-tokens";
  amountToken: bigint;
  lockPeriod: bigint; // Number of cycles to lock for
}

export interface MiningClaimTxArgs {
  functionName: "claim-mining-reward";
  minerBlockHeight: bigint;
}

export interface StackingClaimTxArgs {
  functionName: "claim-stacking-reward";
  rewardCycle: bigint;
}

export function isValidMiningTxArgs(decoded: any): decoded is MiningTxArgs {
  return (
    typeof decoded === "object" &&
    (decoded.functionName === "mine-tokens" ||
      decoded.functionName === "mine-many") &&
    Array.isArray(decoded.amountsUstx) &&
    decoded.amountsUstx.every((amt) => typeof amt === "bigint" && amt > 0n) // Basic validation: positive bigints
  );
}

export function isValidStackingTxArgs(decoded: any): decoded is StackingTxArgs {
  return (
    typeof decoded === "object" &&
    decoded.functionName === "stack-tokens" &&
    typeof decoded.amountToken === "bigint" &&
    decoded.amountToken > 0n &&
    typeof decoded.lockPeriod === "bigint" &&
    decoded.lockPeriod > 0n
  );
}

export function isValidMiningClaimTxArgs(
  decoded: any
): decoded is MiningClaimTxArgs {
  return (
    typeof decoded === "object" &&
    decoded.functionName === "claim-mining-reward" &&
    typeof decoded.minerBlockHeight === "bigint" &&
    decoded.minerBlockHeight > 0n
  );
}

export function isValidStackingClaimTxArgs(
  decoded: any
): decoded is StackingClaimTxArgs {
  return (
    typeof decoded === "object" &&
    decoded.functionName === "claim-stacking-reward" &&
    typeof decoded.rewardCycle === "bigint" &&
    decoded.rewardCycle > 0n
  );
}

export function decodeTxArgs(tx: Transaction): any | null {
  if (tx.tx_type !== "contract_call") return null;
  const rawArgs = tx.contract_call.function_args || [];
  console.log("Raw args for tx " + tx.tx_id + ":", rawArgs);

  const decodedArgs: any[] = [];
  for (const arg of rawArgs) {
    try {
      const cv: ClarityValue = deserializeCV(Buffer.from(arg.hex.replace(/^0x/, ''), "hex"));
      console.log("Deserialized CV for arg " + arg.name + ":", cv);
      const decoded = decodeClarityValues(cv);
      console.log("Decoded value for arg " + arg.name + ":", decoded);
      decodedArgs.push(decoded);
    } catch (e) {
      console.error(
        "Failed to deserialize arg for tx " + tx.tx_id + ":",
        arg,
        e
      );
      return null;
    }
  }

  // Reconstruct object with arg names if available, or by known order
  const structured: any = { functionName: tx.contract_call.function_name };

  // For simplicity, map by known function signatures (expand as needed)
  switch (tx.contract_call.function_name) {
    case "mine-tokens":
      // First arg: uint amountUstx
      structured.amountsUstx = [safeConvertToBigint(decodedArgs[0])];
      break;
    case "mine-many":
      // First arg: list of uint (amounts)
      structured.amountsUstx = decodedArgs[0].map((val: any) =>
        safeConvertToBigint(val)
      );
      break;
    case "stack-tokens":
      // Assuming amountToken (uint), lockPeriod (uint)
      structured.amountToken = safeConvertToBigint(decodedArgs[0]);
      structured.lockPeriod = safeConvertToBigint(decodedArgs[1]);
      break;
    case "claim-mining-reward":
      // Assuming minerBlockHeight (uint)
      structured.minerBlockHeight = safeConvertToBigint(decodedArgs[0]);
      break;
    case "claim-stacking-reward":
      // Assuming rewardCycle (uint)
      structured.rewardCycle = safeConvertToBigint(decodedArgs[0]);
      break;
    default:
      return null;
  }

  console.log("Structured decoded for tx " + tx.tx_id + ":", structured);

  return structured;
}
