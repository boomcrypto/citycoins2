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
  getUserId,
  checkMiningWinner,
  checkStackingCycle,
  findEntry,
} from "../utilities/transactions";
import { City, Version, REGISTRY } from "../utilities/contracts";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../store/stacks";

interface HistoryEntry {
  id: number;
  txId: string;
  claimTxId?: string;
  status: "claimed" | "unclaimed";
  contractId: string;
  functionName: string;
  entry?: { city: City; version: Version; module: string };
}

export function useCityHistory(
  filteredTransactions: ContractCallTransaction[],
  stxAddress: string | null
) {
  const [miningHistory, setMiningHistory] = useState<HistoryEntry[]>([]);
  const [isMiningLoading, setIsMiningLoading] = useState(true);

  const [stackingHistory, setStackingHistory] = useState<HistoryEntry[]>([]);
  const [isStackingLoading, setIsStackingLoading] = useState(true);

  // Local cache for userIds (per contract; in production, use Jotai atoms)
  const [userIdCache, setUserIdCache] = useState<Map<string, bigint>>(new Map());

  useEffect(() => {
    if (!stxAddress) {
      setMiningHistory([]);
      setIsMiningLoading(false);
      setStackingHistory([]);
      setIsStackingLoading(false);
      setUserIdCache(new Map());
      return;
    }

    let isMounted = true;

    const processHistory = async () => {
      try {
        // Step 1: Collect claimed from tx history
        const claimedMining: {
          block: number;
          claimTxId: string;
          contractId: string;
          functionName: string;
          entry: { city: City; version: Version; module: string };
        }[] = [];
        const claimedStacking: {
          cycle: number;
          claimTxId: string;
          contractId: string;
          functionName: string;
          entry: { city: City; version: Version; module: string };
        }[] = [];

        filteredTransactions.forEach((tx) => {
          const decoded = decodeTxArgs(tx);
          const entry = findEntry(tx.contract_call.contract_id, tx.contract_call.function_name);
          if (!entry || tx.tx_status !== "success" || !decoded) return;

          if (isValidMiningClaimTxArgs(decoded)) {
            claimedMining.push({
              block: Number(decoded.minerBlockHeight),
              claimTxId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
              entry,
            });
          } else if (isValidStackingClaimTxArgs(decoded)) {
            claimedStacking.push({
              cycle: Number(decoded.rewardCycle),
              claimTxId: tx.tx_id,
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
              entry,
            });
          }
        });

        // Step 2: Collect potentials from mining/stacking txs
        const potentialMining = new Map<
          string,
          { block: number; txId: string; contractId: string; functionName: string; entry: { city: City; version: Version; module: string } }[]
        >(); // Group by contractId
        const potentialStacking = new Map<
          string,
          { cycle: number; txId: string; contractId: string; functionName: string; entry: { city: City; version: Version; module: string } }[]
        >(); // Group by contractId

        filteredTransactions.forEach((tx) => {
          const decoded = decodeTxArgs(tx);
          const entry = findEntry(tx.contract_call.contract_id, tx.contract_call.function_name);
          if (!entry || tx.tx_status !== "success" || !decoded) return;

          if (isValidMiningTxArgs(decoded) && decoded.city && decoded.version) {
            const blocks = computeTargetedBlocks(tx, decoded);
            blocks.forEach((block) => {
              if (!potentialMining.has(tx.contract_call.contract_id)) {
                potentialMining.set(tx.contract_call.contract_id, []);
              }
              potentialMining.get(tx.contract_call.contract_id)!.push({
                block,
                txId: tx.tx_id,
                contractId: tx.contract_call.contract_id,
                functionName: tx.contract_call.function_name,
                entry,
              });
            });
          } else if (isValidStackingTxArgs(decoded) && decoded.city && decoded.version) {
            const cycles = computeTargetedCycles(tx, decoded, decoded.city, decoded.version);
            cycles.forEach((cycle) => {
              if (!potentialStacking.has(tx.contract_call.contract_id)) {
                potentialStacking.set(tx.contract_call.contract_id, []);
              }
              potentialStacking.get(tx.contract_call.contract_id)!.push({
                cycle,
                txId: tx.tx_id,
                contractId: tx.contract_call.contract_id,
                functionName: tx.contract_call.function_name,
                entry,
              });
            });
          }
        });

        // Step 3: Fetch userIds for unique contracts (core needs own, ccd006/007 use shared ccd003)
        const uniqueContracts = new Set([
          ...Array.from(potentialMining.keys()),
          ...Array.from(potentialStacking.keys()),
          ...claimedMining.map(c => c.contractId),
          ...claimedStacking.map(c => c.contractId),
        ]);
        const userIds = new Map<string, bigint>();
        for (const contractId of uniqueContracts) {
          const entry = findEntry(contractId, ''); // Find any matching entry
          if (entry && entry.module === 'core') {
            // Core has own get-user-id
            try {
              const userId = await getUserId(stxAddress, contractId);
              userIds.set(contractId, userId);
              setUserIdCache(prev => new Map(prev).set(contractId, userId));
            } catch (e) {
              console.error(`Failed to fetch userId for ${contractId}:`, e);
            }
          } else {
            // ccd006/007 use shared ccd003
            try {
              const userId = await getUserId(stxAddress);
              userIds.set('ccd003', userId); // Shared
              setUserIdCache(prev => new Map(prev).set('ccd003', userId));
            } catch (e) {
              console.error('Failed to fetch shared userId:', e);
            }
            break; // Only once for shared
          }
        }

        // Step 4: Prepare claimed history (match txId)
        const historyMining: HistoryEntry[] = claimedMining.map((c) => {
          const potential = potentialMining.get(c.contractId)?.find(p => p.block === c.block);
          return {
            id: c.block,
            txId: potential?.txId || 'Unknown',
            claimTxId: c.claimTxId,
            status: 'claimed' as const,
            contractId: c.contractId,
            functionName: c.functionName,
            entry: c.entry,
          };
        });

        const historyStacking: HistoryEntry[] = claimedStacking.map((c) => {
          const potential = potentialStacking.get(c.contractId)?.find(p => p.cycle === c.cycle);
          return {
            id: c.cycle,
            txId: potential?.txId || 'Unknown',
            claimTxId: c.claimTxId,
            status: 'claimed' as const,
            contractId: c.contractId,
            functionName: c.functionName,
            entry: c.entry,
          };
        });

        // Step 5: Check unclaimed potentials (filter out already claimed)
        setIsMiningLoading(true);
        const toCheckMining: {
          block: number;
          txId: string;
          contractId: string;
          functionName: string;
          entry: { city: City; version: Version; module: string };
        }[] = [];
        potentialMining.forEach((potentials, contractId) => {
          potentials.forEach((p) => {
            if (!claimedMining.some((c) => c.block === p.block && c.contractId === contractId)) {
              toCheckMining.push(p);
            }
          });
        });

        const miningChecks = toCheckMining.map(async (item) => {
          try {
            const userId = userIdCache.get(item.contractId) || userIdCache.get('ccd003');
            const isWinner = await checkMiningWinner(item.entry, item.block, stxAddress, userId);
            if (isWinner) {
              return {
                id: item.block,
                txId: item.txId,
                claimTxId: undefined,
                status: 'unclaimed' as const,
                contractId: item.contractId,
                functionName: item.functionName,
                entry: item.entry,
              };
            }
          } catch (e) {
            console.error(`Error checking mining block ${item.block}:`, e);
          }
          return null;
        });

        const miningResults = await Promise.allSettled(miningChecks);
        const unclaimedMining = miningResults
          .filter((r): r is PromiseFulfilledResult<HistoryEntry | null> => r.status === 'fulfilled')
          .map(r => r.value)
          .filter((h): h is HistoryEntry => h !== null);
        const fullMiningHistory = [...historyMining, ...unclaimedMining].sort((a, b) => a.id - b.id);
        if (isMounted) {
          setMiningHistory(fullMiningHistory);
          setIsMiningLoading(false);
        }

        // Similar for stacking
        setIsStackingLoading(true);
        const toCheckStacking: {
          cycle: number;
          txId: string;
          contractId: string;
          functionName: string;
          entry: { city: City; version: Version; module: string };
        }[] = [];
        potentialStacking.forEach((potentials, contractId) => {
          potentials.forEach((p) => {
            if (!claimedStacking.some((c) => c.cycle === p.cycle && c.contractId === contractId)) {
              toCheckStacking.push(p);
            }
          });
        });

        const stackingChecks = toCheckStacking.map(async (item) => {
          try {
            const userId = userIdCache.get(item.contractId) || userIdCache.get('ccd003');
            if (!userId) return null;
            const isStacked = await checkStackingCycle(item.entry, item.cycle, stxAddress, userId);
            if (isStacked) {
              return {
                id: item.cycle,
                txId: item.txId,
                claimTxId: undefined,
                status: 'unclaimed' as const,
                contractId: item.contractId,
                functionName: item.functionName,
                entry: item.entry,
              };
            }
          } catch (e) {
            console.error(`Error checking stacking cycle ${item.cycle}:`, e);
          }
          return null;
        });

        const stackingResults = await Promise.allSettled(stackingChecks);
        const unclaimedStacking = stackingResults
          .filter((r): r is PromiseFulfilledResult<HistoryEntry | null> => r.status === 'fulfilled')
          .map(r => r.value)
          .filter((h): h is HistoryEntry => h !== null);
        const fullStackingHistory = [...historyStacking, ...unclaimedStacking].sort((a, b) => a.id - b.id);
        if (isMounted) {
          setStackingHistory(fullStackingHistory);
          setIsStackingLoading(false);
        }

      } catch (error) {
        console.error('Error processing history:', error);
        if (isMounted) {
          setIsMiningLoading(false);
          setIsStackingLoading(false);
        }
      }
    };

    processHistory();

    return () => {
      isMounted = false;
    };
  }, [filteredTransactions, stxAddress, userIdCache]);

  return { miningHistory, isMiningLoading, stackingHistory, isStackingLoading };
}
