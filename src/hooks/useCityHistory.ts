import { useEffect, useState } from "react";
import { ContractCallTransaction, Transaction } from "@stacks/stacks-blockchain-api-types";
import { ClarityType, uintCV } from "@stacks/transactions";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
  computeTargetedBlocks,
  computeTargetedCycles,
  fetchCallReadOnlyFunction,
} from "../utilities/transactions";
import { City, Version } from "../utilities/contracts";

interface HistoryEntry {
  id: number;
  txId: string;
  claimTxId?: string;
  status: "claimed" | "unclaimed";
  contractId: string;
  functionName: string;
}

export function useCityHistory(
  filteredTransactions: ContractCallTransaction[],
  stxAddress: string
) {
  const [miningHistory, setMiningHistory] = useState<HistoryEntry[]>([]);
  const [isMiningLoading, setIsMiningLoading] = useState(true);

  const [stackingHistory, setStackingHistory] = useState<HistoryEntry[]>([]);
  const [isStackingLoading, setIsStackingLoading] = useState(true);

  useEffect(() => {
    // Collect claimed mining blocks from claim txs
    const claimedMining: {
      block: number;
      claimTxId: string;
      contractId: string;
      functionName: string;
    }[] = [];
    filteredTransactions.forEach(
      (tx) => {
        const decoded = decodeTxArgs(tx);
        if (
          tx.tx_status === "success" &&
          decoded &&
          isValidMiningClaimTxArgs(decoded)
        ) {
          claimedMining.push({
            block: Number(decoded.minerBlockHeight),
            claimTxId: tx.tx_id,
            contractId: tx.contract_call.contract_id,
            functionName: tx.contract_call.function_name,
          });
        }
      },
      [filteredTransactions, stxAddress]
    );

    // Collect potential mining blocks from mining txs
    const potentialMining = new Map<
      number,
      { txId: string; contractId: string; functionName: string }
    >();
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (decoded && isValidMiningTxArgs(decoded)) {
        const blocks = computeTargetedBlocks(tx, decoded);
        blocks.forEach((b) => {
          if (!potentialMining.has(b)) {
            potentialMining.set(b, {
              txId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
            });
          }
        });
      }
    });

    // Prepare history with claimed
    const historyMining: HistoryEntry[] = claimedMining.map((c) => ({
      id: c.block,
      txId: "", // will fill later
      claimTxId: c.claimTxId,
      status: "claimed",
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match mining tx for claimed
    historyMining.forEach((entry) => {
      const potential = potentialMining.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = "Unknown";
      }
    });

    // Filter potentials not claimed
    const toCheckMining = Array.from(potentialMining.entries()).filter(
      ([b]) => !claimedMining.some((c) => c.block === b)
    );

    setIsMiningLoading(true);
    const checkMiningPromises = toCheckMining.map(async ([block, info]) => {
      const [contractAddress, contractName] = info.contractId.split(".");
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "claim-mining-reward",
          functionArgs: [uintCV(block)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: block,
            txId: info.txId,
            claimTxId: undefined,
            status: "unclaimed" as const,
            contractId: info.contractId,
            functionName: info.functionName,
          };
        } else {
          return null;
        }
      } catch (e) {
        console.error(`Error checking mining block ${block}:`, e);
        return null;
      }
    });

    Promise.all(checkMiningPromises)
      .then((results) => {
        const unclaimedMining = results.filter(
          (r) => r !== null
        ) as HistoryEntry[];
        const fullHistory = [...historyMining, ...unclaimedMining].sort(
          (a, b) => a.id - b.id
        );
        setMiningHistory(fullHistory);
        setIsMiningLoading(false);
      })
      .catch((error) => {
        console.error("Error processing mining claims:", error);
        setIsMiningLoading(false);
      });

    // Similar for stacking
    const claimedStacking: {
      cycle: number;
      claimTxId: string;
      contractId: string;
      functionName: string;
    }[] = [];
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (
        tx.tx_status === "success" &&
        decoded &&
        isValidStackingClaimTxArgs(decoded)
      ) {
        claimedStacking.push({
          cycle: Number(decoded.rewardCycle),
          claimTxId: tx.tx_id,
          contractId: tx.contract_call.contract_id,
          functionName: tx.contract_call.function_name,
        });
      }
    });

    const potentialStacking = new Map<
      number,
      { txId: string; contractId: string; functionName: string }
    >();
    filteredTransactions.forEach((tx) => {
      const decoded = decodeTxArgs(tx);
      if (
        decoded &&
        isValidStackingTxArgs(decoded) &&
        decoded.city &&
        decoded.version
      ) {
        const cycles = computeTargetedCycles(
          tx,
          decoded,
          decoded.city as City,
          decoded.version as Version
        );
        cycles.forEach((c) => {
          if (!potentialStacking.has(c)) {
            potentialStacking.set(c, {
              txId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
            });
          }
        });
      }
    });

    // Prepare history with claimed
    const historyStacking: HistoryEntry[] = claimedStacking.map((c) => ({
      id: c.cycle,
      txId: "", // will fill later
      claimTxId: c.claimTxId,
      status: "claimed",
      contractId: c.contractId,
      functionName: c.functionName,
    }));

    // Match stacking tx for claimed
    historyStacking.forEach((entry) => {
      const potential = potentialStacking.get(entry.id);
      if (potential) {
        entry.txId = potential.txId;
      } else {
        entry.txId = "Unknown";
      }
    });

    // Filter potentials not claimed
    const toCheckStacking = Array.from(potentialStacking.entries()).filter(
      ([c]) => !claimedStacking.some((cl) => cl.cycle === c)
    );

    setIsStackingLoading(true);
    const checkStackingPromises = toCheckStacking.map(async ([cycle, info]) => {
      const [contractAddress, contractName] = info.contractId.split(".");
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "claim-stacking-reward",
          functionArgs: [uintCV(cycle)],
          senderAddress: stxAddress,
        });
        if (result.type === ClarityType.ResponseOk) {
          return {
            id: cycle,
            txId: info.txId,
            claimTxId: undefined,
            status: "unclaimed" as const,
            contractId: info.contractId,
            functionName: info.functionName,
          };
        } else {
          return null;
        }
      } catch (e) {
        console.error(`Error checking stacking cycle ${cycle}:`, e);
        return null;
      }
    });

    Promise.all(checkStackingPromises)
      .then((results) => {
        const unclaimedStacking = results.filter(
          (r) => r !== null
        ) as HistoryEntry[];
        const fullHistory = [...historyStacking, ...unclaimedStacking].sort(
          (a, b) => a.id - b.id
        );
        setStackingHistory(fullHistory);
        setIsStackingLoading(false);
      })
      .catch((error) => {
        console.error("Error processing stacking claims:", error);
        setIsStackingLoading(false);
      });
  }, [filteredTransactions, stxAddress]);

  return { miningHistory, isMiningLoading, stackingHistory, isStackingLoading };
}
