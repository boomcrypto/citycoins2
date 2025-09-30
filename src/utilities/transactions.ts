import { ClarityValue, deserializeCV, uintCV, cvToHex, principalCV, ClarityType, ResponseOkCV, SomeCV } from "@stacks/transactions";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { decodeClarityValues, safeConvertToBigint } from "./clarity";
import { findEntry, categorize, City, Version, Module, USER_REGISTRY_CONTRACT, CITY_ID_MAP, getCityConfig } from './contracts';
import { CITY_CONFIG, getVersionByBlock, getVersionByCycle } from '../config/city-config';
import { HIRO_API } from "../store/common";

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
    Array.isArray(decoded.amountsUstx) && decoded.amountsUstx.every((amt: unknown) => typeof amt === "bigint" && amt > 0n);
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
  let decodeError = false;
  for (const arg of rawArgs) {
    try {
      const cv: ClarityValue = deserializeCV(arg.hex);
      decodedArgs.push(decodeClarityValues(cv));
    } catch (e) {
      console.warn(`Failed to deserialize arg for tx ${tx.tx_id}:`, arg, e);
      decodedArgs.push(null);  // Partial: push null for failed arg
      decodeError = true;
    }
  }

  if (decodeError) {
    console.warn(`Partial decode for tx ${tx.tx_id}: some args failed`);
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
      if (entry.module !== 'core' || decodedArgs.length < 1 || decodedArgs.length > 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'number') return null;
      // Ignore optional buff if present
      return { ...base, functionName: "mine-tokens", amountsUstx: [safeConvertToBigint(decodedArgs[0])] } as MiningTxArgs;

    case "mine-many":
      if (entry.module !== 'core' || decodedArgs.length !== 1 || !Array.isArray(decodedArgs[0]) || decodedArgs[0].some((a: any) => a === null || typeof a !== 'number')) return null;
      return { ...base, functionName: "mine-many", amountsUstx: decodedArgs[0].map(safeConvertToBigint) } as MiningTxArgs;

    case "mine":
      if (entry.module !== 'mining' || decodedArgs.length !== 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'string' || !Array.isArray(decodedArgs[1]) || decodedArgs[1].some((a: any) => a === null || typeof a !== 'number')) return null;
      const cityName = decodedArgs[0];
      if (cityName !== 'MIA' && cityName !== 'NYC') {
        console.warn(`Invalid cityName '${cityName}' for mine tx ${tx.tx_id}`);
        return null;
      }
      return { ...base, functionName: "mine", cityName, amountsUstx: decodedArgs[1].map(safeConvertToBigint) } as MiningTxArgs;

    case "stack-tokens":
      if (entry.module !== 'core' || decodedArgs.length !== 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'number' || decodedArgs[1] === null || typeof decodedArgs[1] !== 'number') return null;
      const lockPeriodTokens = safeConvertToBigint(decodedArgs[1]);
      if (lockPeriodTokens > 12n) {  // Reasonable max lock
        console.warn(`Suspicious lock period ${lockPeriodTokens} for stack-tokens tx ${tx.tx_id}`);
        return null;
      }
      return { ...base, functionName: "stack-tokens", amountToken: safeConvertToBigint(decodedArgs[0]), lockPeriod: lockPeriodTokens } as StackingTxArgs;

    case "stack":
      if (entry.module !== 'stacking' || decodedArgs.length !== 3 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'string' || decodedArgs[1] === null || typeof decodedArgs[1] !== 'number' || decodedArgs[2] === null || typeof decodedArgs[2] !== 'number') return null;
      const cityNameStack = decodedArgs[0];
      if (cityNameStack !== 'MIA' && cityNameStack !== 'NYC') {
        console.warn(`Invalid cityName '${cityNameStack}' for stack tx ${tx.tx_id}`);
        return null;
      }
      const lockPeriodStack = safeConvertToBigint(decodedArgs[2]);
      if (lockPeriodStack > 12n) {
        console.warn(`Suspicious lock period ${lockPeriodStack} for stack tx ${tx.tx_id}`);
        return null;
      }
      return { ...base, functionName: "stack", cityName: cityNameStack, amountToken: safeConvertToBigint(decodedArgs[1]), lockPeriod: lockPeriodStack } as StackingTxArgs;

    case "claim-mining-reward":
      if (entry.module === 'mining') {
        if (decodedArgs.length !== 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'string' || decodedArgs[1] === null || typeof decodedArgs[1] !== 'number') return null;
        const cityNameClaim = decodedArgs[0];
        if (cityNameClaim !== 'MIA' && cityNameClaim !== 'NYC') return null;
        return { ...base, functionName: "claim-mining-reward", cityName: cityNameClaim, minerBlockHeight: safeConvertToBigint(decodedArgs[1]) } as MiningClaimTxArgs;
      } else if (entry.module === 'core') {
        if (decodedArgs.length !== 1 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'number') return null;
        return { ...base, functionName: "claim-mining-reward", minerBlockHeight: safeConvertToBigint(decodedArgs[0]) } as MiningClaimTxArgs;
      }
      return null;

    case "claim-stacking-reward":
      if (entry.module === 'stacking') {
        if (decodedArgs.length !== 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'string' || decodedArgs[1] === null || typeof decodedArgs[1] !== 'number') return null;
        const cityNameClaimStack = decodedArgs[0];
        if (cityNameClaimStack !== 'MIA' && cityNameClaimStack !== 'NYC') return null;
        return { ...base, functionName: "claim-stacking-reward", cityName: cityNameClaimStack, rewardCycle: safeConvertToBigint(decodedArgs[1]) } as StackingClaimTxArgs;
      } else if (entry.module === 'core') {
        if (decodedArgs.length !== 1 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'number') return null;
        return { ...base, functionName: "claim-stacking-reward", rewardCycle: safeConvertToBigint(decodedArgs[0]) } as StackingClaimTxArgs;
      }
      return null;

    case "transfer":
      if (entry.module !== 'token' || decodedArgs.length < 2 || decodedArgs[0] === null || typeof decodedArgs[0] !== 'number' || decodedArgs[1] === null || typeof decodedArgs[1] !== 'string') return null;
      const transfer: TransferTxArgs = {
        ...base,
        functionName: "transfer",
        amount: safeConvertToBigint(decodedArgs[0]),
        recipient: decodedArgs[1],
      };
      if (decodedArgs.length === 3 && decodedArgs[2] !== null) {
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

const CYCLE_LENGTH = 2100;

export function computeTargetedBlocks(tx: Transaction, decoded: MiningTxArgs): number[] {
  if (tx.tx_status !== 'success') return [];
  const N = decoded.amountsUstx.length;
  const start = tx.block_height + 1;
  const blocks = Array.from({ length: N }, (_, i) => start + i);

  // Validate against mining window using version helpers
  const version = getVersionByBlock(decoded.city!, blocks[0]);
  if (!version) {
    console.warn(`Invalid mining blocks for ${decoded.city} at height ${blocks[0]}`);
    return [];
  }
  const config = getCityConfig(decoded.city!, version);
  if (!config || !config.mining.activated || blocks[0] < config.mining.activationBlock) return [];
  if (config.mining.shutdown && blocks[blocks.length - 1] > config.mining.shutdownBlock!) return [];

  return blocks;
}

export function computeTargetedCycles(tx: Transaction, decoded: StackingTxArgs, city: City, version: Version): number[] {
  if (tx.tx_status !== 'success') return [];
  const configVersion = getCityConfig(city, version);
  if (!configVersion) return [];
  const genesisBlock = configVersion.stacking.genesisBlock;
  const cycleLength = configVersion.stacking.cycleLength;
  const currentCycle = Math.floor((tx.block_height - genesisBlock) / cycleLength);
  const lock = Number(decoded.lockPeriod);
  // Validate against startCycle and endCycle if defined
  const startCycle = configVersion.stacking.startCycle;
  const endCycle = configVersion.stacking.endCycle;
  const cycles = Array.from({ length: lock }, (_, i) => currentCycle + 1 + i);
  if (startCycle !== undefined && cycles[0] < startCycle) {
    console.warn(`Invalid stacking cycles for ${city} version ${version}: starts before ${startCycle}`);
    return [];
  }
  if (endCycle !== undefined && cycles[cycles.length - 1] > endCycle) {
    console.warn(`Invalid stacking cycles for ${city} version ${version}: exceeds ${endCycle}`);
    return [];
  }
  return cycles;
}

export async function fetchCallReadOnlyFunction(options: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}): Promise<ClarityValue> {
  const url = `${HIRO_API}/v2/contracts/call-read/${options.contractAddress}/${options.contractName}/${options.functionName}`;
  const body = {
    sender: options.senderAddress,
    arguments: options.functionArgs.map(arg => cvToHex(arg)),
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (!data.okay) {
    throw new Error(data.cause);
  }
  return deserializeCV(data.result);
}

// Helper to get cityId from city
export function getCityId(city: City): number {
  return CITY_ID_MAP[city];
}

// Helper to fetch userId from registry or core contract
export async function getUserId(principal: string, contractId?: string): Promise<bigint> {
  if (!principal) throw new Error('Principal required');
  let contractAddress: string;
  let contractName: string;
  let functionName = 'get-user-id';

  if (contractId) {
    [contractAddress, contractName] = contractId.split('.');
  } else {
    // Default to shared ccd003
    contractAddress = USER_REGISTRY_CONTRACT.split('.')[0];
    contractName = USER_REGISTRY_CONTRACT.split('.')[1];
  }

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs: [principalCV(principal)],
    senderAddress: principal,
  });

  if (result.type !== ClarityType.UInt) {
    throw new Error('Invalid userId response');
  }

  return safeConvertToBigint(result.value);
}

// Helper to check if user won a mining block (unclaimed if true and no claim tx)
export async function checkMiningWinner(
  entry: { contract: string; readonlyFunctions?: { miningCheck?: string }; city: City; module: Module; version: Version },
  block: number,
  principal: string,
  userId?: bigint
): Promise<boolean> {
  // Maturity check: validate block against version window
  const version = getVersionByBlock(entry.city, block);
  if (!version || version !== entry.version) {
    console.warn(`Block ${block} invalid for ${entry.city} version ${entry.version}`);
    return false;
  }
  const config = getCityConfig(entry.city, entry.version);
  if (!config || !config.mining.activated || block < config.mining.activationBlock) return false;
  if (config.mining.shutdown && block > config.mining.shutdownBlock!) return false;

  if (!entry.readonlyFunctions?.miningCheck) {
    throw new Error('No mining check function available');
  }

  const [contractAddress, contractName] = entry.contract.split('.');
  const functionName = entry.readonlyFunctions.miningCheck;
  let functionArgs: ClarityValue[] = [];

  if (entry.module === 'core') {
    // Core: is-block-winner (user principal) (minerBlockHeight uint)
    functionArgs = [principalCV(principal), uintCV(block)];
  } else if (entry.module === 'mining') {
    // ccd006: is-block-winner (cityId uint) (user principal) (claimHeight uint)
    const cityId = getCityId(entry.city);
    functionArgs = [uintCV(cityId), principalCV(principal), uintCV(block)];
  } else {
    throw new Error('Unsupported module for mining check');
  }

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress: principal,
  });

  // Assume bool true for winner (adjust if ResponseOk)
  return result.type === ClarityType.BoolTrue;
}

// Helper to check if user stacked in a cycle (unclaimed if Some with amount >0 and no claim tx)
export async function checkStackingCycle(
  entry: { contract: string; readonlyFunctions?: { stackingCheck?: string }; city: City; module: Module; version: Version },
  cycle: number,
  principal: string,
  userId: bigint
): Promise<boolean> {
  // Maturity check: validate cycle against version window
  const version = getVersionByCycle(entry.city, cycle);
  if (!version || version !== entry.version) {
    console.warn(`Cycle ${cycle} invalid for ${entry.city} version ${entry.version}`);
    return false;
  }
  const config = getCityConfig(entry.city, entry.version);
  if (!config || cycle < config.stacking.startCycle) return false;
  if (config.stacking.endCycle !== undefined && cycle > config.stacking.endCycle) return false;

  if (!entry.readonlyFunctions?.stackingCheck) {
    throw new Error('No stacking check function available');
  }
  if (!userId) {
    throw new Error('UserId required for stacking check');
  }

  const [contractAddress, contractName] = entry.contract.split('.');
  const functionName = entry.readonlyFunctions.stackingCheck;
  let functionArgs: ClarityValue[] = [];

  if (entry.module === 'core') {
    // Core: get-stacker-at-cycle (rewardCycle uint) (userId uint) -> optional {amount: uint, lock: uint}
    functionArgs = [uintCV(cycle), uintCV(Number(userId))];
  } else if (entry.module === 'stacking') {
    // ccd007: get-stacker (cityId uint) (cycle uint) (userId uint) -> ResponseOk {amount: uint}
    const cityId = getCityId(entry.city);
    functionArgs = [uintCV(cityId), uintCV(cycle), uintCV(Number(userId))];
  } else {
    throw new Error('Unsupported module for stacking check');
  }

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress: principal,
  });

  let isStacked = false;

  if (entry.module === 'core') {
    // Optional Some with amount >0
    if (result.type === ClarityType.OptionalSome) {
      const some = result as SomeCV;
      const decoded = decodeClarityValues(some.value);
      isStacked = decoded.amount > 0n;
    }
  } else if (entry.module === 'stacking') {
    // ResponseOk with amount >0
    if (result.type === ClarityType.ResponseOk) {
      const ok = result as ResponseOkCV;
      const decoded = decodeClarityValues(ok.value);
      isStacked = decoded.amount > 0n;
    }
  }

  return isStacked;
}
