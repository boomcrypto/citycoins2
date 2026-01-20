import { ClarityValue, deserializeCV } from "@stacks/transactions";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { decodeClarityValues, safeConvertToBigint } from "./clarity";
import { Buffer } from "buffer";
import { getAllMiningContracts, getAllStackingContracts, getAllStackingClaimContracts } from "../config/city-config";

// Set of all valid CityCoins contract IDs for quick lookup
// Includes mining, stacking, AND stacking claim contracts (which differ for DAO versions)
const CITYCOINS_CONTRACTS = new Set([
  ...getAllMiningContracts('mia'),
  ...getAllMiningContracts('nyc'),
  ...getAllStackingContracts('mia'),
  ...getAllStackingContracts('nyc'),
  ...getAllStackingClaimContracts('mia'),
  ...getAllStackingClaimContracts('nyc'),
]);

export interface MiningTxArgs {
  functionName: "mine-tokens" | "mine-many" | "mine"; // Covers variations, including "mine"
  amountsUstx: bigint[]; // Array for multi-block (e.g., mine-many or mine); single for mine-tokens
  cityName?: string; // Optional: city name for "mine" function
  // Other args like memo if present
}

export interface StackingTxArgs {
  functionName: "stack-tokens" | "stack";
  amountToken: bigint;
  lockPeriod: bigint; // Number of cycles to lock for
  cityName?: string; // For DAO "stack" function
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
      decoded.functionName === "mine-many" ||
      decoded.functionName === "mine") &&
    Array.isArray(decoded.amountsUstx) &&
    decoded.amountsUstx.every((amt: any) => typeof amt === "bigint" && amt > 0n) // Basic validation: positive bigints
  );
}

export function isValidStackingTxArgs(decoded: any): decoded is StackingTxArgs {
  return (
    typeof decoded === "object" &&
    (decoded.functionName === "stack-tokens" || decoded.functionName === "stack") &&
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

export function decodeTxArgs(tx: Transaction, debug = false): any | null {
  if (tx.tx_type !== "contract_call") {
    if (debug) console.log("decodeTxArgs: not a contract call");
    return null;
  }

  // Only process CityCoins contracts to avoid false matches with other contracts
  // that happen to have similar function names (e.g., "claim")
  if (!CITYCOINS_CONTRACTS.has(tx.contract_call.contract_id)) {
    if (debug) console.log("decodeTxArgs: contract not in CITYCOINS_CONTRACTS:", tx.contract_call.contract_id);
    if (debug) console.log("decodeTxArgs: CITYCOINS_CONTRACTS has", CITYCOINS_CONTRACTS.size, "entries:", Array.from(CITYCOINS_CONTRACTS));
    return null;
  }

  const rawArgs = tx.contract_call.function_args || [];
  if (debug) console.log("decodeTxArgs: function", tx.contract_call.function_name, "with", rawArgs.length, "args");

  const decodedArgs: any[] = [];
  for (const arg of rawArgs) {
    try {
      const cv: ClarityValue = deserializeCV(
        Buffer.from(arg.hex.replace(/^0x/, ""), "hex")
      );
      // Use strictJsonCompat=false to get bigints directly instead of strings
      // This is important for distinguishing numeric args from string city names
      const decoded = decodeClarityValues(cv, false);
      decodedArgs.push(decoded);
      if (debug) console.log("decodeTxArgs: decoded arg:", arg.name, "=", decoded, "type:", typeof decoded);
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
  // Each case validates expected argument count before accessing
  switch (tx.contract_call.function_name) {
    case "mine-tokens":
      // First arg: uint amountUstx
      if (decodedArgs.length < 1) return null;
      structured.amountsUstx = [safeConvertToBigint(decodedArgs[0])];
      break;
    case "mine-many":
      // First arg: list of uint (amounts)
      if (decodedArgs.length < 1 || !Array.isArray(decodedArgs[0])) return null;
      structured.amountsUstx = decodedArgs[0].map((val: any) =>
        safeConvertToBigint(val)
      );
      break;
    case "mine":
      // First arg is the city as a string, second is list of uints
      if (decodedArgs.length < 2 || !Array.isArray(decodedArgs[1])) return null;
      structured.cityName = decodedArgs[0];
      structured.amountsUstx = decodedArgs[1].map((val: any) =>
        safeConvertToBigint(val)
      );
      break;
    case "stack-tokens":
      // Assuming amountToken (uint), lockPeriod (uint)
      if (decodedArgs.length < 2) return null;
      structured.amountToken = safeConvertToBigint(decodedArgs[0]);
      structured.lockPeriod = safeConvertToBigint(decodedArgs[1]);
      break;
    case "stack":
      // DAO stack function: (cityName, amount, lockPeriod)
      // Note: Earlier versions may have used (cityName, amounts-list) but current DAO uses 3 args
      if (decodedArgs.length < 2) return null;

      // First arg is always cityName
      structured.cityName = decodedArgs[0];

      if (Array.isArray(decodedArgs[1])) {
        // Old format: (cityName, amounts-per-cycle-list)
        const stackAmounts = decodedArgs[1].map((val: any) =>
          safeConvertToBigint(val)
        );
        structured.lockPeriod = BigInt(stackAmounts.length);
        structured.amountToken = stackAmounts.reduce(
          (sum: bigint, amt: bigint) => sum + amt,
          0n
        );
      } else {
        // Current format: (cityName, amount, lockPeriod)
        structured.amountToken = safeConvertToBigint(decodedArgs[1]);
        structured.lockPeriod = decodedArgs.length >= 3
          ? safeConvertToBigint(decodedArgs[2])
          : 1n;
      }
      break;
    case "claim-mining-reward":
      // First arg can be city name (string) or the block height (uint)
      if (decodedArgs.length < 1) return null;
      if (typeof decodedArgs[0] === "string") {
        if (decodedArgs.length < 2) return null;
        structured.cityName = decodedArgs[0];
        structured.minerBlockHeight = safeConvertToBigint(decodedArgs[1]);
      } else {
        structured.minerBlockHeight = safeConvertToBigint(decodedArgs[0]);
      }
      break;
    case "claim-stacking-reward":
      // First arg can be city name (string) or the reward cycle (uint)
      if (decodedArgs.length < 1) return null;
      if (decodedArgs.length === 2) {
        structured.cityName = decodedArgs[0];
        structured.rewardCycle = safeConvertToBigint(decodedArgs[1]);
      } else {
        structured.rewardCycle = safeConvertToBigint(decodedArgs[0]);
      }
      break;
    default:
      return null;
  }

  return structured;
}
