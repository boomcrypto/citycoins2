import {
  Button,
  Table,
  Stack,
  HStack,
  Input,
  Select,
  Text,
  Portal,
  createListCollection,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { StackingRow } from "./StackingRow";
import { VirtualizedStackingTable } from "./VirtualizedStackingTable";
import type { StackingEntry } from "./types";

const ITEMS_PER_PAGE = 50;

const stackingStatusFilterCollection = createListCollection({
  items: [
    { label: "All Statuses", value: "all" },
    { label: "Claimable", value: "claimable" },
    { label: "Unverified", value: "unverified" },
    { label: "Locked", value: "locked" },
    { label: "Claimed", value: "claimed" },
    { label: "No Reward", value: "no-reward" },
    { label: "Unavailable", value: "unavailable" },
  ],
});

export interface PaginatedStackingTableProps {
  entries: StackingEntry[];
  onClaim: (entry: StackingEntry) => void;
  onVerify: (entry: StackingEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
  hasUserIds: boolean;
}

export function PaginatedStackingTable({
  entries,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
  hasUserIds,
}: PaginatedStackingTableProps) {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchCycle, setSearchCycle] = useState("");

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (searchCycle && !String(entry.cycle).includes(searchCycle)) return false;
      return true;
    });
  }, [entries, statusFilter, searchCycle]);

  // Paginate
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchCycle]);

  // Use virtualization for large filtered lists
  const useVirtualization = filteredEntries.length > 100;

  if (entries.length === 0) {
    return <Text color="fg.muted">No stacking history found.</Text>;
  }

  return (
    <Stack gap={4}>
      {/* Filters */}
      <HStack gap={4} flexWrap="wrap">
        <Select.Root
          collection={stackingStatusFilterCollection}
          value={[statusFilter]}
          onValueChange={(e) => setStatusFilter(e.value[0])}
          size="sm"
          w="auto"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="All Statuses" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {stackingStatusFilterCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <Input
          placeholder="Search by cycle..."
          value={searchCycle}
          onChange={(e) => setSearchCycle(e.target.value)}
          size="sm"
          w="150px"
        />
        <Text fontSize="sm" color="fg.muted">
          Showing {paginatedEntries.length} of {filteredEntries.length} entries
        </Text>
      </HStack>

      {/* Table */}
      {useVirtualization ? (
        <VirtualizedStackingTable
          entries={filteredEntries}
          onClaim={onClaim}
          onVerify={onVerify}
          claimingId={claimingId}
          isVerifying={isVerifying}
          hasUserIds={hasUserIds}
        />
      ) : (
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
          <Table.Body>
            {paginatedEntries.map((entry) => (
              <StackingRow
                key={`${entry.txId}-${entry.cycle}`}
                entry={entry}
                onClaim={onClaim}
                onVerify={onVerify}
                claimingId={claimingId}
                isVerifying={isVerifying}
                hasUserIds={hasUserIds}
              />
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {/* Pagination */}
      {totalPages > 1 && !useVirtualization && (
        <HStack gap={2} justify="center">
          <Button
            size="xs"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Text fontSize="sm">
            Page {page + 1} of {totalPages}
          </Text>
          <Button
            size="xs"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </HStack>
      )}
    </Stack>
  );
}
