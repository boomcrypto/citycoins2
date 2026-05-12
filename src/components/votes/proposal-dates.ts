export type ProposalDateMetadata = {
  isoDate: string;
  source: "governance" | "on-chain";
};

export const PROPOSAL_DATES: Record<string, ProposalDateMetadata> = {
  ccip026: { isoDate: "2025-02-17", source: "governance" },
  ccip016: { isoDate: "2023-04-26", source: "governance" },
  ccip025: { isoDate: "2024-10-23", source: "governance" },
  ccip024: { isoDate: "2024-08-01", source: "governance" },
  ccip019: { isoDate: "2024-01-04", source: "governance" },
  ccip022: { isoDate: "2024-04-23", source: "governance" },
  ccip020: { isoDate: "2024-03-22", source: "governance" },
  ccip021: { isoDate: "2024-04-04", source: "governance" },
  ccip017: { isoDate: "2023-08-31", source: "governance" },
  ccip014: { isoDate: "2023-04-19", source: "governance" },
  "vote-v3": { isoDate: "2022-08-15", source: "governance" },
  "vote-v2": { isoDate: "2022-08-04", source: "governance" },
  "vote-v1": { isoDate: "2022-03-25", source: "governance" },
};

const PROPOSAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatProposalDate(isoDate: string) {
  return PROPOSAL_DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00Z`));
}

export function getProposalDateLabel(proposalId: string) {
  const metadata = PROPOSAL_DATES[proposalId];

  if (!metadata) {
    return undefined;
  }

  return `Created ${formatProposalDate(metadata.isoDate)}`;
}
