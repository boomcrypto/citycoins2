import { useEffect, useState, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";
import { userIdsAtom, getUserIdKey } from "../store/stacks";
import {
  decodeTxArgs,
  isValidMiningTxArgs,
  isValidStackingTxArgs,
  isValidMiningClaimTxArgs,
  isValidStackingClaimTxArgs,
  computeTargetedBlocks,
  computeTargetedCycles,
  getUserId,
  checkMiningWinner,
  checkStackingCycle,
} from "../utilities/transactions";
import { City, REGISTRY, Version } from "../utilities/contracts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HistoryEntry {
  id: number;
  txId: string;
  claimTxId?: string;
  status: "claimed" | "unclaimed" | "unknown";
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

  const userIds = useAtomValue(userIdsAtom);
  const setUserIds = useSetAtom(userIdsAtom);
  const userIdsRef = useRef(userIds);

  useEffect(() => {
    userIdsRef.current = userIds;
  }, [userIds]);

  useEffect(() => {
    if (!stxAddress) {
      setMiningHistory([]);
      setIsMiningLoading(false);
      setStackingHistory([]);
      setIsStackingLoading(false);
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
          const entry = REGISTRY.find(e => e.contract === tx.contract_call.contract_id && e.functions.includes(tx.contract_call.function_name));
          if (!entry || tx.tx_status !== "success") return;
          if (!decoded) {
            console.warn(`Skipped claim tx ${tx.tx_id}: decode failed`);
            return;
          }

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
          const entry = REGISTRY.find(e => e.contract === tx.contract_call.contract_id && e.functions.includes(tx.contract_call.function_name));
          if (!entry || tx.tx_status !== "success") return;
          if (!decoded) {
            console.warn(`Skipped potential tx ${tx.tx_id}: decode failed`);
            return;
          }

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

        // Step 3: Fetch userIds for unique contracts using structured keys (core per version, shared for ccd006/007)
        const uniqueContracts = new Set([
          ...Array.from(potentialMining.keys()),
          ...Array.from(potentialStacking.keys()),
          ...claimedMining.map(c => c.contractId),
          ...claimedStacking.map(c => c.contractId),
        ]);
        const uniqueKeys = new Set<string>();
        const runtimeUserIds = new Map<string, bigint>();

        // Collect unique keys from entries
        for (const contractId of uniqueContracts) {
          const entry = REGISTRY.find(e => e.contract === contractId);
          if (!entry || entry.module === 'token') continue; // Skip tokens
          try {
            const key = getUserIdKey(entry.city, entry.module, entry.version);
            uniqueKeys.add(key);
          } catch (e) {
            console.warn(`Skipping invalid key for ${contractId}:`, e);
          }
        }

        // Fetch missing user IDs in batch (only if not cached)
        const missingKeys: string[] = [];
        uniqueKeys.forEach(key => {
          const cachedUserIdStr = userIdsRef.current[key];
          if (!cachedUserIdStr) {
            missingKeys.push(key);
          }
        });

        if (missingKeys.length > 0) {
          // For shared 'ccd003-shared', fetch once
          // For core keys, fetch per contract (but batch if possible; here sequential for simplicity)
          for (const key of missingKeys) {
            try {
              await sleep(500); // Rate limit: 500ms between fetches
              let userId: bigint;
              if (key === 'ccd003-shared') {
                userId = await getUserId(stxAddress);
              } else {
                // Parse city/module/version from key for core fetch
                const [cityStr, moduleStr, versionStr] = key.split('-');
                const city = cityStr as City;
                const version = versionStr as Version;
                // Find a core entry for this city/version to fetch userId
                const coreEntry = REGISTRY.find(e => e.city === city && e.module === 'core' && e.version === version);
                if (!coreEntry) throw new Error(`No core entry for ${key}`);
                userId = await getUserId(stxAddress, coreEntry.contract);
              }
              setUserIds(prev => ({ ...prev, [key]: userId.toString() }));
              // Note: runtimeUserIds populated per contract below
            } catch (e) {
              console.error(`Failed to fetch userId for key ${key}:`, e);
            }
          }
        }

        // Populate runtimeUserIds from cache (now updated)
        for (const contractId of uniqueContracts) {
          const entry = REGISTRY.find(e => e.contract === contractId);
          if (!entry || entry.module === 'token') continue;
          try {
            const key = getUserIdKey(entry.city, entry.module, entry.version);
            const cachedUserIdStr = userIdsRef.current[key];
            if (cachedUserIdStr) {
              const userId = BigInt(cachedUserIdStr);
              runtimeUserIds.set(contractId, userId);
            }
          } catch (e) {
            console.warn(`Skipping userId for ${contractId}:`, e);
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

        // Batch mining checks with rate limiting
        const miningChecks = [];
        for (let i = 0; i < toCheckMining.length; i += 5) {
          const chunk = toCheckMining.slice(i, i + 5);
          const chunkChecks = chunk.map(async (item) => {
            try {
              // Ensure entry has version for validation
              const entryWithVersion = { ...item.entry, version: item.entry.version };
              const userId = runtimeUserIds.get(item.contractId);
              if (!userId) {
                console.warn(`Skipped mining check for block ${item.block}: missing userId`);
                return null;
              }
              const isWinner = await checkMiningWinner(entryWithVersion, item.block, stxAddress, userId);
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
              return {
                id: item.block,
                txId: item.txId,
                claimTxId: undefined,
                status: 'unknown' as const,
                contractId: item.contractId,
                functionName: item.functionName,
                entry: item.entry,
              };
            }
            return null;
          });
          miningChecks.push(...chunkChecks);
          if (i + 5 < toCheckMining.length) {
            await sleep(500); // Rate limit between chunks
          }
        }

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

        // Batch stacking checks with rate limiting
        const stackingChecks = [];
        for (let i = 0; i < toCheckStacking.length; i += 5) {
          const chunk = toCheckStacking.slice(i, i + 5);
          const chunkChecks = chunk.map(async (item) => {
            try {
              // Ensure entry has version for validation
              const entryWithVersion = { ...item.entry, version: item.entry.version };
              const userId = runtimeUserIds.get(item.contractId);
              if (!userId) {
                console.warn(`Skipped stacking check for cycle ${item.cycle}: missing userId`);
                return null;
              }
              const isStacked = await checkStackingCycle(entryWithVersion, item.cycle, stxAddress, userId);
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
              return {
                id: item.cycle,
                txId: item.txId,
                claimTxId: undefined,
                status: 'unknown' as const,
                contractId: item.contractId,
                functionName: item.functionName,
                entry: item.entry,
              };
            }
            return null;
          });
          stackingChecks.push(...chunkChecks);
          if (i + 5 < toCheckStacking.length) {
            await sleep(500); // Rate limit between chunks
          }
        }

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
  }, [filteredTransactions, stxAddress]); // Removed userIds from deps to prevent loop

  return { miningHistory, isMiningLoading, stackingHistory, isStackingLoading };
}
