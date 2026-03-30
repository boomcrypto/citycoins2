import { Button, Table, Box, Text } from "@chakra-ui/react";
import { memo } from "react";
import { StatusBadge } from "./StatusBadge";
import { formatStackedAmount } from "./types";
import type { StackingEntry } from "./types";

export interface StackingRowProps {
  entry: StackingEntry;
  onClaim: (entry: StackingEntry) => void;
  onVerify: (entry: StackingEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
  hasUserIds: boolean;
}

export const StackingRow = memo(function StackingRow({
  entry,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
  hasUserIds,
}: StackingRowProps) {
  const isClaiming = claimingId === `stacking-${entry.cycle}`;

  return (
    <Table.Row>
      <Table.Cell>{entry.cycle}</Table.Cell>
      <Table.Cell>{entry.version}</Table.Cell>
      <Table.Cell>{formatStackedAmount(entry.amountTokens, entry.version)}</Table.Cell>
      <Table.Cell><StatusBadge status={entry.status} /></Table.Cell>
      <Table.Cell minH="32px">
        {entry.status === "claimable" ? (
          <Button
            size="xs"
            onClick={() => onClaim(entry)}
            disabled={isClaiming}
          >
            {isClaiming ? "..." : "Claim"}
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
});
