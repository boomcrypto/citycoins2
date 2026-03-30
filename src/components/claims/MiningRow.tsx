import { Button, Table, Box } from "@chakra-ui/react";
import { memo } from "react";
import { StatusBadge } from "./StatusBadge";
import type { MiningEntry } from "./types";

export interface MiningRowProps {
  entry: MiningEntry;
  onClaim: (entry: MiningEntry) => void;
  onVerify: (entry: MiningEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
}

export const MiningRow = memo(function MiningRow({
  entry,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
}: MiningRowProps) {
  const isClaiming = claimingId === `mining-${entry.block}`;

  return (
    <Table.Row>
      <Table.Cell>{entry.block}</Table.Cell>
      <Table.Cell>{entry.version}</Table.Cell>
      <Table.Cell>{(Number(entry.amountUstx) / 1_000_000).toFixed(6)}</Table.Cell>
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
});
