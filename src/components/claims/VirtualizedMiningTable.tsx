import { Button, Table, Box } from "@chakra-ui/react";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { StatusBadge } from "./StatusBadge";
import type { MiningEntry } from "./types";

export interface VirtualizedMiningTableProps {
  entries: MiningEntry[];
  onClaim: (entry: MiningEntry) => void;
  onVerify: (entry: MiningEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
}

export function VirtualizedMiningTable({
  entries,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
}: VirtualizedMiningTableProps) {
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
            <Table.ColumnHeader>Block</Table.ColumnHeader>
            <Table.ColumnHeader>Version</Table.ColumnHeader>
            <Table.ColumnHeader>Commit (STX)</Table.ColumnHeader>
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
                key={`${entry.txId}-${entry.block}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Table.Cell>{entry.block}</Table.Cell>
                <Table.Cell>{entry.version}</Table.Cell>
                <Table.Cell>{(Number(entry.amountUstx) / 1_000_000).toFixed(6)}</Table.Cell>
                <Table.Cell><StatusBadge status={entry.status} /></Table.Cell>
                <Table.Cell minH="32px">
                  {entry.status === "claimable" ? (
                    <Button
                      size="xs"
                      onClick={() => onClaim(entry)}
                      disabled={claimingId === `mining-${entry.block}`}
                    >
                      {claimingId === `mining-${entry.block}` ? "..." : "Claim"}
                    </Button>
                  ) : entry.status === "unverified" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onVerify(entry)}
                      disabled={isVerifying}
                    >
                      Verify
                    </Button>
                  ) : entry.status === "error" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onVerify(entry)}
                      disabled={isVerifying}
                    >
                      Retry
                    </Button>
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
