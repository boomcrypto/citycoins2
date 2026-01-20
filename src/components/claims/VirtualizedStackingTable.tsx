import { Button, Table, Box, Text } from "@chakra-ui/react";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { StatusBadge } from "./StatusBadge";
import { formatStackedAmount } from "./types";
import type { StackingEntry } from "./types";

export interface VirtualizedStackingTableProps {
  entries: StackingEntry[];
  onClaim: (entry: StackingEntry) => void;
  onVerify: (entry: StackingEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
  hasUserIds: boolean;
}

export function VirtualizedStackingTable({
  entries,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
  hasUserIds,
}: VirtualizedStackingTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <Box ref={parentRef} maxH="400px" overflowY="auto" width="100%">
      <Table.Root size="sm" width="100%">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Cycle</Table.ColumnHeader>
            <Table.ColumnHeader>Version</Table.ColumnHeader>
            <Table.ColumnHeader>Stacked</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Action</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const entry = entries[virtualRow.index];
            return (
              <Table.Row
                key={`${entry.txId}-${entry.cycle}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Table.Cell>{entry.cycle}</Table.Cell>
                <Table.Cell>{entry.version}</Table.Cell>
                <Table.Cell>{formatStackedAmount(entry.amountTokens, entry.version)}</Table.Cell>
                <Table.Cell><StatusBadge status={entry.status} /></Table.Cell>
                <Table.Cell minH="32px">
                  {entry.status === "claimable" ? (
                    <Button
                      size="xs"
                      onClick={() => onClaim(entry)}
                      disabled={claimingId === `stacking-${entry.cycle}`}
                    >
                      {claimingId === `stacking-${entry.cycle}` ? "..." : "Claim"}
                    </Button>
                  ) : entry.status === "unverified" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onVerify(entry)}
                      disabled={isVerifying || !hasUserIds}
                    >
                      Verify
                    </Button>
                  ) : entry.status === "unavailable" && entry.claimTxId ? (
                    <Text fontSize="xs" color="fg.muted">Failed</Text>
                  ) : (
                    <Box minH="24px" />
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
