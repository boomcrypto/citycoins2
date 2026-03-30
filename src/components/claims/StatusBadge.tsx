import { Badge } from "@chakra-ui/react";
import { memo } from "react";

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: "yellow",
  unverified: "orange",
  claimable: "green",
  claimed: "gray",
  locked: "blue",
  "not-won": "red",
  "no-reward": "orange",
  unavailable: "red",
  error: "red",
};

const STATUS_DISPLAY_MAP: Record<string, string> = {
  pending: "pending",
  unverified: "unverified",
  claimable: "claimable",
  claimed: "claimed",
  locked: "locked",
  "not-won": "not won",
  "no-reward": "no reward",
  unavailable: "unavailable",
  error: "error",
};

export const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const colorScheme = STATUS_COLOR_MAP[status] || "gray";
  const displayText = STATUS_DISPLAY_MAP[status] || status;

  return <Badge colorPalette={colorScheme}>{displayText}</Badge>;
});
