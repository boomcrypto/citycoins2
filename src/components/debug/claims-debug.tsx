/**
 * Debug component for claims detection analysis.
 * Shows detailed information about transaction processing and city detection.
 * Remove this component once debugging is complete.
 */

import {
  Accordion,
  Badge,
  Box,
  Code,
  Heading,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { atom } from "jotai";
import { transactionsAtom } from "../../store/stacks";
import {
  miningEntriesAtom,
  stackingEntriesAtom,
  MiningEntry,
  StackingEntry,
} from "../../store/claims";
import { CityName, findContractInfo } from "../../config/city-config";
import { decodeTxArgs } from "../../utilities/transactions";
import { ContractCallTransaction } from "@stacks/stacks-blockchain-api-types";

interface ClaimsDebugProps {
  city: CityName;
}

// Atom to analyze raw transactions
const transactionAnalysisAtom = atom((get) => {
  const transactions = get(transactionsAtom);

  const miningFunctions = ["mine-tokens", "mine-many", "mine"];
  const stackingFunctions = ["stack-tokens", "stack"];

  const analysis = {
    total: transactions.length,
    contractCalls: 0,
    miningTxs: [] as Array<{
      txId: string;
      contractId: string;
      functionName: string;
      status: string;
      contractInfo: ReturnType<typeof findContractInfo>;
      decodedCityName: string | undefined;
      decodedFull: Record<string, unknown> | null;
      rawFirstArg: unknown;
      rawFirstArgType: string;
    }>,
    stackingTxs: [] as Array<{
      txId: string;
      contractId: string;
      functionName: string;
      status: string;
      contractInfo: ReturnType<typeof findContractInfo>;
      decodedCityName: string | undefined;
      decodedFull: Record<string, unknown> | null;
      rawFirstArg: unknown;
      rawFirstArgType: string;
    }>,
    contractCounts: {} as Record<string, number>,
  };

  for (const tx of transactions) {
    if (tx.tx_type !== "contract_call") continue;
    analysis.contractCalls++;

    const contractTx = tx as ContractCallTransaction;
    const { contract_id: contractId, function_name: functionName } = contractTx.contract_call;

    // Count by contract
    analysis.contractCounts[contractId] = (analysis.contractCounts[contractId] || 0) + 1;

    // Analyze mining transactions
    if (miningFunctions.includes(functionName)) {
      const decoded = decodeTxArgs(tx);
      const contractInfo = findContractInfo(contractId);

      // Get raw first arg for debugging
      const rawArgs = contractTx.contract_call.function_args || [];
      let rawFirstArg: unknown = undefined;
      let rawFirstArgType = "none";
      if (rawArgs.length > 0) {
        try {
          // Store repr and type info
          rawFirstArg = rawArgs[0]?.repr || rawArgs[0]?.hex?.slice(0, 30) + "...";
          rawFirstArgType = rawArgs[0]?.type || "unknown";
        } catch {
          rawFirstArg = "error reading";
        }
      }

      analysis.miningTxs.push({
        txId: tx.tx_id.slice(0, 10) + "...",
        contractId,
        functionName,
        status: tx.tx_status,
        contractInfo,
        decodedCityName: decoded?.cityName,
        decodedFull: decoded ? {
          functionName: decoded.functionName,
          cityName: decoded.cityName,
          cityNameType: typeof decoded.cityName,
          amountsLength: decoded.amountsUstx?.length,
        } : null,
        rawFirstArg,
        rawFirstArgType,
      });
    }

    // Analyze stacking transactions
    if (stackingFunctions.includes(functionName)) {
      const decoded = decodeTxArgs(tx);
      const contractInfo = findContractInfo(contractId);

      const rawArgs = contractTx.contract_call.function_args || [];
      let rawFirstArg: unknown = undefined;
      let rawFirstArgType = "none";
      if (rawArgs.length > 0) {
        try {
          rawFirstArg = rawArgs[0]?.repr || rawArgs[0]?.hex?.slice(0, 30) + "...";
          rawFirstArgType = rawArgs[0]?.type || "unknown";
        } catch {
          rawFirstArg = "error reading";
        }
      }

      analysis.stackingTxs.push({
        txId: tx.tx_id.slice(0, 10) + "...",
        contractId,
        functionName,
        status: tx.tx_status,
        contractInfo,
        decodedCityName: decoded?.cityName,
        decodedFull: decoded ? {
          functionName: decoded.functionName,
          cityName: decoded.cityName,
          cityNameType: typeof decoded.cityName,
        } : null,
        rawFirstArg,
        rawFirstArgType,
      });
    }
  }

  return analysis;
});

// Summarize entries by city and version
function summarizeEntries<T extends MiningEntry | StackingEntry>(
  entries: T[],
  idField: "block" | "cycle"
): Record<string, Record<string, number>> {
  const summary: Record<string, Record<string, number>> = {};

  for (const entry of entries) {
    const city = entry.city;
    const version = entry.version;

    if (!summary[city]) summary[city] = {};
    if (!summary[city][version]) summary[city][version] = 0;
    summary[city][version]++;
  }

  return summary;
}

function ClaimsDebug({ city }: ClaimsDebugProps) {
  const analysis = useAtomValue(transactionAnalysisAtom);
  const miningEntries = useAtomValue(miningEntriesAtom);
  const stackingEntries = useAtomValue(stackingEntriesAtom);

  const miningSummary = summarizeEntries(miningEntries, "block");
  const stackingSummary = summarizeEntries(stackingEntries, "cycle");

  // Filter transactions for this city
  const cityMiningTxs = analysis.miningTxs.filter(
    (tx) => tx.contractInfo?.city === city || tx.decodedCityName?.toLowerCase() === city
  );
  const cityStackingTxs = analysis.stackingTxs.filter(
    (tx) => tx.contractInfo?.city === city || tx.decodedCityName?.toLowerCase() === city
  );

  // Find transactions that might be miscategorized
  const daoMiningTxs = analysis.miningTxs.filter(
    (tx) => tx.contractInfo?.version === "daoV1" || tx.contractInfo?.version === "daoV2"
  );
  const daoStackingTxs = analysis.stackingTxs.filter(
    (tx) => tx.contractInfo?.version === "daoV1" || tx.contractInfo?.version === "daoV2"
  );

  // Check for issues
  const daoMiningWithoutCityName = daoMiningTxs.filter((tx) => !tx.decodedCityName);
  const daoStackingWithoutCityName = daoStackingTxs.filter((tx) => !tx.decodedCityName);

  return (
    <Accordion.Item value="debug-info">
      <Accordion.ItemTrigger>
        <Heading size="xl">
          Debug Info
          <Badge colorPalette="purple" ml={2}>DEV</Badge>
        </Heading>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent p={4}>
        <Stack gap={6}>
          {/* Overview */}
          <Box>
            <Heading size="md" mb={2}>Transaction Overview</Heading>
            <Stack gap={1}>
              <Text>Total transactions: <Code>{analysis.total}</Code></Text>
              <Text>Contract calls: <Code>{analysis.contractCalls}</Code></Text>
              <Text>Mining TXs (all cities): <Code>{analysis.miningTxs.length}</Code></Text>
              <Text>Stacking TXs (all cities): <Code>{analysis.stackingTxs.length}</Code></Text>
            </Stack>
          </Box>

          {/* Entry Summary by City/Version */}
          <Box>
            <Heading size="md" mb={2}>Mining Entries by City/Version</Heading>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>City</Table.ColumnHeader>
                  <Table.ColumnHeader>legacyV1</Table.ColumnHeader>
                  <Table.ColumnHeader>legacyV2</Table.ColumnHeader>
                  <Table.ColumnHeader>daoV1</Table.ColumnHeader>
                  <Table.ColumnHeader>daoV2</Table.ColumnHeader>
                  <Table.ColumnHeader>Total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {["mia", "nyc"].map((c) => {
                  const cityData = miningSummary[c] || {};
                  const total = Object.values(cityData).reduce((a, b) => a + b, 0);
                  return (
                    <Table.Row key={c} bg={c === city ? "blue.900" : undefined}>
                      <Table.Cell fontWeight="bold">{c.toUpperCase()}</Table.Cell>
                      <Table.Cell>{cityData.legacyV1 || 0}</Table.Cell>
                      <Table.Cell>{cityData.legacyV2 || 0}</Table.Cell>
                      <Table.Cell>{cityData.daoV1 || 0}</Table.Cell>
                      <Table.Cell>{cityData.daoV2 || 0}</Table.Cell>
                      <Table.Cell fontWeight="bold">{total}</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          <Box>
            <Heading size="md" mb={2}>Stacking Entries by City/Version</Heading>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>City</Table.ColumnHeader>
                  <Table.ColumnHeader>legacyV1</Table.ColumnHeader>
                  <Table.ColumnHeader>legacyV2</Table.ColumnHeader>
                  <Table.ColumnHeader>daoV1</Table.ColumnHeader>
                  <Table.ColumnHeader>daoV2</Table.ColumnHeader>
                  <Table.ColumnHeader>Total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {["mia", "nyc"].map((c) => {
                  const cityData = stackingSummary[c] || {};
                  const total = Object.values(cityData).reduce((a, b) => a + b, 0);
                  return (
                    <Table.Row key={c} bg={c === city ? "blue.900" : undefined}>
                      <Table.Cell fontWeight="bold">{c.toUpperCase()}</Table.Cell>
                      <Table.Cell>{cityData.legacyV1 || 0}</Table.Cell>
                      <Table.Cell>{cityData.legacyV2 || 0}</Table.Cell>
                      <Table.Cell>{cityData.daoV1 || 0}</Table.Cell>
                      <Table.Cell>{cityData.daoV2 || 0}</Table.Cell>
                      <Table.Cell fontWeight="bold">{total}</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Potential Issues */}
          <Box>
            <Heading size="md" mb={2}>Potential Issues</Heading>
            <Stack gap={2}>
              {daoMiningWithoutCityName.length > 0 && (
                <Box p={2} bg="red.900" borderRadius="md">
                  <Text fontWeight="bold" color="red.200">
                    DAO Mining TXs without cityName: {daoMiningWithoutCityName.length}
                  </Text>
                  <Text fontSize="sm">These transactions will be skipped!</Text>
                </Box>
              )}
              {daoStackingWithoutCityName.length > 0 && (
                <Box p={2} bg="red.900" borderRadius="md">
                  <Text fontWeight="bold" color="red.200">
                    DAO Stacking TXs without cityName: {daoStackingWithoutCityName.length}
                  </Text>
                  <Text fontSize="sm">These transactions will be skipped!</Text>
                </Box>
              )}
              {daoMiningWithoutCityName.length === 0 && daoStackingWithoutCityName.length === 0 && (
                <Text color="green.300">No obvious issues detected</Text>
              )}
            </Stack>
          </Box>

          {/* Contract Counts */}
          <Box>
            <Heading size="md" mb={2}>Transactions by Contract</Heading>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Contract</Table.ColumnHeader>
                  <Table.ColumnHeader>Count</Table.ColumnHeader>
                  <Table.ColumnHeader>Detected City</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.entries(analysis.contractCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 15)
                  .map(([contract, count]) => {
                    const info = findContractInfo(contract);
                    const shortContract = contract.split(".")[1] || contract;
                    return (
                      <Table.Row key={contract}>
                        <Table.Cell>
                          <Code fontSize="xs">{shortContract}</Code>
                        </Table.Cell>
                        <Table.Cell>{count}</Table.Cell>
                        <Table.Cell>
                          {info ? (
                            <Badge colorPalette={info.city === city ? "green" : "gray"}>
                              {info.city} / {info.version}
                            </Badge>
                          ) : (
                            <Badge colorPalette="gray">N/A</Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Sample DAO Transactions */}
          {daoMiningTxs.length > 0 && (
            <Box>
              <Heading size="md" mb={2}>DAO Mining TX Samples (first 10)</Heading>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>TX ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Function</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Contract City</Table.ColumnHeader>
                    <Table.ColumnHeader>Decoded cityName</Table.ColumnHeader>
                    <Table.ColumnHeader>Raw 1st Arg (type)</Table.ColumnHeader>
                    <Table.ColumnHeader>Decoded Full</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {daoMiningTxs.slice(0, 10).map((tx, i) => (
                    <Table.Row key={i}>
                      <Table.Cell><Code fontSize="xs">{tx.txId}</Code></Table.Cell>
                      <Table.Cell>{tx.functionName}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={tx.status === "success" ? "green" : "red"}>
                          {tx.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{tx.contractInfo?.city || "?"}</Table.Cell>
                      <Table.Cell>
                        {tx.decodedCityName ? (
                          <Badge colorPalette="green">{tx.decodedCityName}</Badge>
                        ) : (
                          <Badge colorPalette="red">undefined</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Code fontSize="xs">{String(tx.rawFirstArg).slice(0, 15)}</Code>
                        <Text fontSize="xs" color="fg.muted">({tx.rawFirstArgType})</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Code fontSize="xs">
                          {tx.decodedFull ? JSON.stringify(tx.decodedFull) : "null"}
                        </Code>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* Entry Comparison - Check for duplicates */}
          <Box>
            <Heading size="md" mb={2}>Entry Analysis</Heading>

            {/* Raw counts */}
            <Box mb={4} p={2} bg="gray.800" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Raw Entry Counts (before filtering)</Text>
              <Text>Total entries in miningEntriesAtom: <Code>{miningEntries.length}</Code></Text>
              <Text>Entries with city="mia": <Code>{miningEntries.filter(e => e.city === "mia").length}</Code></Text>
              <Text>Entries with city="nyc": <Code>{miningEntries.filter(e => e.city === "nyc").length}</Code></Text>
              <Text>Entries with other city: <Code>{miningEntries.filter(e => e.city !== "mia" && e.city !== "nyc").length}</Code></Text>
            </Box>

            {/* Check for duplicate blocks */}
            <Box mb={4} p={2} bg="gray.800" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Duplicate Block Check</Text>
              {(() => {
                // Group entries by block, tracking city and txId
                const blockData = new Map<number, Array<{city: string, txId: string}>>();
                miningEntries.forEach(e => {
                  if (!blockData.has(e.block)) blockData.set(e.block, []);
                  blockData.get(e.block)!.push({ city: e.city, txId: e.txId.slice(0, 10) });
                });

                const duplicates = Array.from(blockData.entries())
                  .filter(([_, entries]) => {
                    const cities = new Set(entries.map(e => e.city));
                    return cities.size > 1;
                  })
                  .slice(0, 5);

                const totalDuplicates = Array.from(blockData.entries())
                  .filter(([_, entries]) => new Set(entries.map(e => e.city)).size > 1).length;

                if (duplicates.length === 0) {
                  return <Text color="green.300">No blocks appear in multiple cities</Text>;
                }

                // Check if duplicates come from same TX or different TXs
                const sameTxDuplicates = duplicates.filter(([_, entries]) => {
                  const txIds = new Set(entries.map(e => e.txId));
                  return txIds.size === 1; // Same TX created both entries
                });

                return (
                  <Box>
                    <Text color={sameTxDuplicates.length > 0 ? "red.300" : "yellow.300"} mb={2}>
                      Found {totalDuplicates} blocks in both cities.
                      {sameTxDuplicates.length > 0
                        ? ` BUG: ${sameTxDuplicates.length} blocks from SAME TX!`
                        : " (Different TXs - likely legitimate parallel mining)"}
                    </Text>
                    <Text fontSize="sm" mb={1}>First 5 duplicate blocks with TX info:</Text>
                    {duplicates.map(([block, entries]) => {
                      const txIds = new Set(entries.map(e => e.txId));
                      const isSameTx = txIds.size === 1;
                      return (
                        <Code key={block} fontSize="xs" display="block" color={isSameTx ? "red.300" : "inherit"}>
                          Block {block}: {entries.map(e => `${e.city}(${e.txId})`).join(", ")}
                          {isSameTx && " ← SAME TX!"}
                        </Code>
                      );
                    })}
                  </Box>
                );
              })()}
            </Box>

            {/* Sample entries with full details */}
            <Box mb={4}>
              <Text fontWeight="bold" mb={2}>Sample Entry Details (first 3)</Text>
              <Stack gap={1}>
                {miningEntries.slice(0, 3).map((e, i) => (
                  <Code key={i} fontSize="xs" display="block" whiteSpace="pre-wrap">
                    {JSON.stringify({ block: e.block, city: e.city, version: e.version, txId: e.txId.slice(0,10) }, null, 2)}
                  </Code>
                ))}
              </Stack>
            </Box>

            <Text fontSize="sm" color="fg.muted" mb={2}>
              If MIA and NYC show the SAME block numbers, entries are being duplicated.
            </Text>
            <Stack direction="row" gap={4}>
              <Box flex={1}>
                <Text fontWeight="bold" mb={1}>MIA Entries (first 5 blocks)</Text>
                <Stack gap={1}>
                  {miningEntries
                    .filter((e) => e.city === "mia")
                    .slice(0, 5)
                    .map((e, i) => (
                      <Code key={i} fontSize="xs">
                        Block {e.block} ({e.version})
                      </Code>
                    ))}
                </Stack>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" mb={1}>NYC Entries (first 5 blocks)</Text>
                <Stack gap={1}>
                  {miningEntries
                    .filter((e) => e.city === "nyc")
                    .slice(0, 5)
                    .map((e, i) => (
                      <Code key={i} fontSize="xs">
                        Block {e.block} ({e.version})
                      </Code>
                    ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Stacking Entry Analysis */}
          <Box>
            <Heading size="md" mb={2}>Stacking Entry Analysis</Heading>

            {/* Raw stacking counts */}
            <Box mb={4} p={2} bg="gray.800" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Raw Stacking Entry Counts</Text>
              <Text>Total entries in stackingEntriesAtom: <Code>{stackingEntries.length}</Code></Text>
              <Text>Entries with city="mia": <Code>{stackingEntries.filter(e => e.city === "mia").length}</Code></Text>
              <Text>Entries with city="nyc": <Code>{stackingEntries.filter(e => e.city === "nyc").length}</Code></Text>
              <Text>Entries with other city: <Code>{stackingEntries.filter(e => e.city !== "mia" && e.city !== "nyc").length}</Code></Text>
            </Box>

            {/* Check for duplicate cycles */}
            <Box mb={4} p={2} bg="gray.800" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Duplicate Cycle Check</Text>
              {(() => {
                // Group entries by cycle, tracking city, version, and txId
                const cycleData = new Map<number, Array<{city: string, version: string, txId: string}>>();
                stackingEntries.forEach(e => {
                  if (!cycleData.has(e.cycle)) cycleData.set(e.cycle, []);
                  cycleData.get(e.cycle)!.push({ city: e.city, version: e.version, txId: e.txId.slice(0, 10) });
                });

                // Find cycles that appear in both cities
                const duplicateCities = Array.from(cycleData.entries())
                  .filter(([_, entries]) => {
                    const cities = new Set(entries.map(e => e.city));
                    return cities.size > 1;
                  });

                // Find cycles that appear in multiple versions (potential issue)
                const duplicateVersions = Array.from(cycleData.entries())
                  .filter(([_, entries]) => {
                    const versions = new Set(entries.map(e => e.version));
                    return versions.size > 1;
                  });

                return (
                  <Box>
                    {duplicateCities.length > 0 ? (
                      <Box mb={2}>
                        <Text color="yellow.300">
                          {duplicateCities.length} cycles appear in both cities (may be legitimate parallel stacking)
                        </Text>
                        <Text fontSize="sm">First 3:</Text>
                        {duplicateCities.slice(0, 3).map(([cycle, entries]) => (
                          <Code key={cycle} fontSize="xs" display="block">
                            Cycle {cycle}: {entries.map(e => `${e.city}/${e.version}(${e.txId})`).join(", ")}
                          </Code>
                        ))}
                      </Box>
                    ) : (
                      <Text color="green.300" mb={2}>No cycles appear in multiple cities</Text>
                    )}

                    {duplicateVersions.length > 0 ? (
                      <Box>
                        <Text color="red.300">
                          ISSUE: {duplicateVersions.length} cycles appear in multiple versions!
                        </Text>
                        <Text fontSize="sm">First 3:</Text>
                        {duplicateVersions.slice(0, 3).map(([cycle, entries]) => (
                          <Code key={cycle} fontSize="xs" display="block">
                            Cycle {cycle}: {entries.map(e => `${e.city}/${e.version}(${e.txId})`).join(", ")}
                          </Code>
                        ))}
                      </Box>
                    ) : (
                      <Text color="green.300">No cycles appear in multiple versions</Text>
                    )}
                  </Box>
                );
              })()}
            </Box>

            {/* Stacking entries by city comparison */}
            <Stack direction="row" gap={4} mb={4}>
              <Box flex={1}>
                <Text fontWeight="bold" mb={1}>MIA Stacking (first 5 cycles)</Text>
                <Stack gap={1}>
                  {stackingEntries
                    .filter((e) => e.city === "mia")
                    .slice(0, 5)
                    .map((e, i) => (
                      <Code key={i} fontSize="xs">
                        Cycle {e.cycle} ({e.version}) - {e.status}
                      </Code>
                    ))}
                  {stackingEntries.filter(e => e.city === "mia").length === 0 && (
                    <Text fontSize="sm" color="fg.muted">No MIA stacking entries</Text>
                  )}
                </Stack>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" mb={1}>NYC Stacking (first 5 cycles)</Text>
                <Stack gap={1}>
                  {stackingEntries
                    .filter((e) => e.city === "nyc")
                    .slice(0, 5)
                    .map((e, i) => (
                      <Code key={i} fontSize="xs">
                        Cycle {e.cycle} ({e.version}) - {e.status}
                      </Code>
                    ))}
                  {stackingEntries.filter(e => e.city === "nyc").length === 0 && (
                    <Text fontSize="sm" color="fg.muted">No NYC stacking entries</Text>
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* DAO Stacking TX Samples */}
            {analysis.stackingTxs.filter(tx =>
              tx.contractInfo?.version === "daoV1" || tx.contractInfo?.version === "daoV2"
            ).length > 0 && (
              <Box mb={4}>
                <Text fontWeight="bold" mb={2}>DAO Stacking TX Samples</Text>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>TX ID</Table.ColumnHeader>
                      <Table.ColumnHeader>Function</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Contract City</Table.ColumnHeader>
                      <Table.ColumnHeader>Decoded cityName</Table.ColumnHeader>
                      <Table.ColumnHeader>Decoded Full</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {analysis.stackingTxs
                      .filter(tx => tx.contractInfo?.version === "daoV1" || tx.contractInfo?.version === "daoV2")
                      .slice(0, 5)
                      .map((tx, i) => (
                        <Table.Row key={i}>
                          <Table.Cell><Code fontSize="xs">{tx.txId}</Code></Table.Cell>
                          <Table.Cell>{tx.functionName}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={tx.status === "success" ? "green" : "red"}>
                              {tx.status}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{tx.contractInfo?.city || "?"}</Table.Cell>
                          <Table.Cell>
                            {tx.decodedCityName ? (
                              <Badge colorPalette="green">{tx.decodedCityName}</Badge>
                            ) : (
                              <Badge colorPalette="red">undefined</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Code fontSize="xs">
                              {tx.decodedFull ? JSON.stringify(tx.decodedFull) : "null"}
                            </Code>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* Stacking TXs without cityName (potential issues) */}
            {daoStackingWithoutCityName.length > 0 && (
              <Box p={2} bg="red.900" borderRadius="md">
                <Text fontWeight="bold" color="red.200">
                  DAO Stacking TXs without cityName: {daoStackingWithoutCityName.length}
                </Text>
                <Text fontSize="sm" mb={2}>These transactions cannot determine city from shared DAO contract:</Text>
                {daoStackingWithoutCityName.slice(0, 3).map((tx, i) => (
                  <Code key={i} fontSize="xs" display="block">
                    {tx.txId} - {tx.functionName} - raw: {String(tx.rawFirstArg).slice(0, 20)}
                  </Code>
                ))}
              </Box>
            )}
          </Box>

          {/* Sample Legacy Transactions for this city */}
          <Box>
            <Heading size="md" mb={2}>{city.toUpperCase()} Mining TX Samples (first 10)</Heading>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>TX ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Function</Table.ColumnHeader>
                  <Table.ColumnHeader>Version</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {cityMiningTxs.slice(0, 10).map((tx, i) => (
                  <Table.Row key={i}>
                    <Table.Cell><Code fontSize="xs">{tx.txId}</Code></Table.Cell>
                    <Table.Cell>{tx.functionName}</Table.Cell>
                    <Table.Cell>{tx.contractInfo?.version || "?"}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={tx.status === "success" ? "green" : "red"}>
                        {tx.status}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            {cityMiningTxs.length === 0 && (
              <Text color="fg.muted">No mining transactions found for {city.toUpperCase()}</Text>
            )}
          </Box>
        </Stack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default ClaimsDebug;
