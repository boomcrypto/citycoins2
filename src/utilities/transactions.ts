import { ClarityValue, deserializeCV } from "@stacks/transactions";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { decodeClarityValues, safeConvertToBigint } from "./clarity";
import { Buffer } from "buffer";

import { REGISTRY, findEntry, categorize, City, Version, Module } from '../config/contracts';

export interface BaseTxArgs {
  functionName: string;
  city?: City;
  version?: Version;
  module?: Module;
  category?: ReturnType<typeof categorize>;  // 'Mining' | 'Mining Claim' | etc.
}

export interface MiningTxArgs extends BaseTxArgs {
  functionName: "mine-tokens" | "mine-many" | "mine";
  amountsUstx: bigint[];
  cityName?: string;  // For "mine" in ccd006
}

export interface StackingTxArgs extends BaseTxArgs {
  functionName: "stack-tokens" | "stack";
  amountToken: bigint;
  lockPeriod: bigint;  // Corrected: single bigint, not list (fixing potential bug)
  cityName?: string;   // For "stack" in ccd007
}

export interface MiningClaimTxArgs extends BaseTxArgs {
  functionName: "claim-mining-reward";
  minerBlockHeight: bigint;
  cityName?: string;  // For ccd006
}

export interface StackingClaimTxArgs extends BaseTxArgs {
  functionName: "claim-stacking-reward";
  rewardCycle: bigint;
  cityName?: string;  // For ccd007
}

export interface TransferTxArgs extends BaseTxArgs {
  functionName: "transfer";
  amount: bigint;
  recipient: string;
  memo?: string | null;
}

// Union type for convenience in decodeTxArgs return
export type DecodedTxArgs = MiningTxArgs | StackingTxArgs | MiningClaimTxArgs | StackingClaimTxArgs | TransferTxArgs | null;

export function isValidMiningTxArgs(decoded: any): decoded is MiningTxArgs {
  return typeof decoded === "object" && decoded.category === 'Mining' &&
    (decoded.functionName === "mine-tokens" || decoded.functionName === "mine-many" || decoded.functionName === "mine") &&
    Array.isArray(decoded.amountsUstx) && decoded.amountsUstx.every(amt => typeof amt === "bigint" && amt > 0n);
}

export function isValidStackingTxArgs(decoded: any): decoded is StackingTxArgs {
  return typeof decoded === "object" && decoded.category === 'Stacking' &&
    (decoded.functionName === "stack-tokens" || decoded.functionName === "stack") &&
    typeof decoded.amountToken === "bigint" && decoded.amountToken > 0n &&
    typeof decoded.lockPeriod === "bigint" && decoded.lockPeriod > 0n;
}

export function isValidMiningClaimTxArgs(
  decoded: any
): decoded is MiningClaimTxArgs {
  return (
    typeof decoded === "object" && decoded.category === 'Mining Claim' &&
    decoded.functionName === "claim-mining-reward" &&
    typeof decoded.minerBlockHeight === "bigint" &&
    decoded.minerBlockHeight > 0n
  );
}

export function isValidStackingClaimTxArgs(
  decoded: any
): decoded is StackingClaimTxArgs {
  return (
    typeof decoded === "object" && decoded.category === 'Stacking Claim' &&
    decoded.functionName === "claim-stacking-reward" &&
    typeof decoded.rewardCycle === "bigint" &&
    decoded.rewardCycle > 0n
  );
}

export function isValidTransferTxArgs(decoded: any): decoded is TransferTxArgs {
  return (
    typeof decoded === "object" && decoded.category === 'Transfer' &&
    decoded.functionName === "transfer" &&
    typeof decoded.amount === "bigint" && decoded.amount > 0n &&
    typeof decoded.recipient === "string"
  );
}

export function decodeTxArgs(tx: Transaction): DecodedTxArgs {
  if (tx.tx_type !== "contract_call") return null;

  const contractId = tx.contract_call.contract_id;
  const func = tx.contract_call.function_name;
  const entry = findEntry(contractId, func);
  if (!entry) return null;  // Not in registry: unsupported

  const rawArgs = tx.contract_call.function_args || [];
  const decodedArgs: any[] = [];
  for (const arg of rawArgs) {
    try {
      const cv: ClarityValue = deserializeCV(Buffer.from(arg.hex.replace(/^0x/, ""), "hex"));
      decodedArgs.push(decodeClarityValues(cv));
    } catch (e) {
      console.error(`Failed to deserialize arg for tx ${tx.tx_id}:`, arg, e);
      return null;
    }
  }

  const base: BaseTxArgs = {
    functionName: func,
    city: entry.city,
    version: entry.version,
    module: entry.module,
    category: categorize(func),
  };

  switch (func) {
    case "mine-tokens":
      if (entry.module !== 'core' || decodedArgs.length < 1 || decodedArgs.length > 2 || typeof decodedArgs[0] !== 'number') return null;
      return { ...base, amountsUstx: [safeConvertToBigint(decodedArgs[0])] };

    case "mine-many":
      if (entry.module !== 'core' || decodedArgs.length !== 1 || !Array.isArray(decodedArgs[0])) return null;
      return { ...base, amountsUstx: decodedArgs[0].map(safeConvertToBigint) };

    case "mine":
      if (entry.module !== 'mining' || decodedArgs.length !== 2 || typeof decodedArgs[0] !== 'string' || !Array.isArray(decodedArgs[1])) return null;
      return { ...base, cityName: decodedArgs[0], amountsUstx: decodedArgs[1].map(safeConvertToBigint) };

    case "stack-tokens":
      if (entry.module !== 'core' || decodedArgs.length !== 2 || typeof decodedArgs[0] !== 'number' || typeof decodedArgs[1] !== 'number') return null;
      return { ...base, amountToken: safeConvertToBigint(decodedArgs[0]), lockPeriod: safeConvertToBigint(decodedArgs[1]) };

    case "stack":
      if (entry.module !== 'stacking' || decodedArgs.length !== 3 || typeof decodedArgs[0] !== 'string' || typeof decodedArgs[1] !== 'number' || typeof decodedArgs[2] !== 'number') return null;
      return { ...base, cityName: decodedArgs[0], amountToken: safeConvertToBigint(decodedArgs[1]), lockPeriod: safeConvertToBigint(decodedArgs[2]) };  // Corrected: not a list

    case "claim-mining-reward":
      if (entry.module === 'mining') {
        if (decodedArgs.length !== 2 || typeof decodedArgs[0] !== 'string' || typeof decodedArgs[1] !== 'number') return null;
        return { ...base, cityName: decodedArgs[0], minerBlockHeight: safeConvertToBigint(decodedArgs[1]) };
      } else if (entry.module === 'core') {
        if (decodedArgs.length !== 1 || typeof decodedArgs[0] !== 'number') return null;
        return { ...base, minerBlockHeight: safeConvertToBigint(decodedArgs[0]) };
      }
      return null;

    case "claim-stacking-reward":
      if (entry.module === 'stacking') {
        if (decodedArgs.length !== 2 || typeof decodedArgs[0] !== 'string' || typeof decodedArgs[1] !== 'number') return null;
        return { ...base, cityName: decodedArgs[0], rewardCycle: safeConvertToBigint(decodedArgs[1]) };
      } else if (entry.module === 'core') {
        if (decodedArgs.length !== 1 || typeof decodedArgs[0] !== 'number') return null;
        return { ...base, rewardCycle: safeConvertToBigint(decodedArgs[0]) };
      }
      return null;

    case "transfer":
      if (entry.module !== 'token' || decodedArgs.length < 2 || decodedArgs.length > 3 || typeof decodedArgs[0] !== 'number' || typeof decodedArgs[1] !== 'string') return null;
      const transfer: TransferTxArgs = {
        ...base,
        functionName: func,
        amount: safeConvertToBigint(decodedArgs[0]),
        recipient: decodedArgs[1],
      };
      if (decodedArgs.length === 3) {
        transfer.memo = decodedArgs[2];
      }
      return transfer;

    default:
      return null;  // Unsupported function (even if in registry)
  }
}

export function getTxCategory(tx: Transaction): ReturnType<typeof categorize> | null {
  if (tx.tx_type !== "contract_call") return null;
  return categorize(tx.contract_call.function_name);
}
