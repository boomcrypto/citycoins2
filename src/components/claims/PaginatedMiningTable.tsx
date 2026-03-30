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
import { MiningRow } from "./MiningRow";
import { VirtualizedMiningTable } from "./VirtualizedMiningTable";
import type { MiningEntry } from "./types";

const ITEMS_PER_PAGE = 50;

const statusFilterCollection = createListCollection({
  items: [
    { label: "All Statuses", value: "all" },
    { label: "Claimable", value: "claimable" },
    { label: "Unverified", value: "unverified" },
    { label: "Pending", value: "pending" },
    { label: "Claimed", value: "claimed" },
    { label: "Not Won", value: "not-won" },
    { label: "Error", value: "error" },
  ],
});

export interface PaginatedMiningTableProps {
  entries: MiningEntry[];
  onClaim: (entry: MiningEntry) => void;
  onVerify: (entry: MiningEntry) => void;
  claimingId: string | null;
  isVerifying: boolean;
}

export function PaginatedMiningTable({
  entries,
  onClaim,
  onVerify,
  claimingId,
  isVerifying,
}: PaginatedMiningTableProps) {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchBlock, setSearchBlock] = useState("");

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (searchBlock && !String(entry.block).includes(searchBlock)) return false;
      return true;
    });
  }, [entries, statusFilter, searchBlock]);

  // Paginate
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchBlock]);

  // Use virtualization for large filtered lists
  const useVirtualization = filteredEntries.length > 100;

  if (entries.length === 0) {
    return <Text color="fg.muted">No mining history found.</Text>;
  }

  return (
    <Stack gap={4}>
      {/* Filters */}
      <HStack gap={4} flexWrap="wrap">
        <Select.Root
          collection={statusFilterCollection}
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
                {statusFilterCollection.items.map((item) => (
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
          placeholder="Search by block..."
          value={searchBlock}
          onChange={(e) => setSearchBlock(e.target.value)}
          size="sm"
          w="150px"
        />
        <Text fontSize="sm" color="fg.muted">
          Showing {paginatedEntries.length} of {filteredEntries.length} entries
        </Text>
      </HStack>

      {/* Table */}
      {useVirtualization ? (
        <VirtualizedMiningTable
          entries={filteredEntries}
          onClaim={onClaim}
          onVerify={onVerify}
          claimingId={claimingId}
          isVerifying={isVerifying}
        />
      ) : (
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
          <Table.Body>
            {paginatedEntries.map((entry) => (
              <MiningRow
                key={`${entry.txId}-${entry.block}`}
                entry={entry}
                onClaim={onClaim}
                onVerify={onVerify}
                claimingId={claimingId}
                isVerifying={isVerifying}
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
