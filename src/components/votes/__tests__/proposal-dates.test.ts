import { describe, expect, it } from "vitest";
import {
  formatProposalDate,
  getProposalDateLabel,
  PROPOSAL_DATES,
} from "../proposal-dates";

describe("proposal date metadata", () => {
  it("has dates for every voting row", () => {
    expect(Object.keys(PROPOSAL_DATES).sort()).toEqual(
      [
        "ccip014",
        "ccip016",
        "ccip017",
        "ccip019",
        "ccip020",
        "ccip021",
        "ccip022",
        "ccip024",
        "ccip025",
        "ccip026",
        "vote-v1",
        "vote-v2",
        "vote-v3",
      ].sort()
    );
  });

  it("formats proposal dates without timezone drift", () => {
    expect(formatProposalDate("2025-02-17")).toBe("Feb 17, 2025");
  });

  it("returns a display label for known proposal IDs", () => {
    expect(getProposalDateLabel("ccip026")).toBe("Created Feb 17, 2025");
  });

  it("returns undefined for unknown proposal IDs", () => {
    expect(getProposalDateLabel("unknown")).toBeUndefined();
  });
});
