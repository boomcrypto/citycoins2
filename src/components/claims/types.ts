/**
 * Shared types for claims components
 */

import { CityName, Version } from "../../config/city-config";

// Re-export types from store for convenience
export type { MiningEntry, StackingEntry, MiningStatus, StackingStatus } from "../../store/claims";

/**
 * City-specific claims configuration for redemption and display
 */
export interface CityClaimsConfig {
  cityName: CityName;
  displayName: string;   // "Miami" | "New York City"
  symbol: string;        // "MIA" | "NYC"
  assetId: string;       // "miamicoin" | "newyorkcitycoin"
  v1Contract: string;
  v2Contract: string;
  redemptionContract: string;
  redemptionFunction: string;  // "redeem-mia" | "redeem-nyc"
  ccipLink: { text: string; href: string };
  pendingApproval?: boolean;  // Show "Pending approval" text
}

/**
 * Format stacked token amount based on version.
 * legacyV1 tokens have 0 decimals, legacyV2+ have 6 decimals.
 */
export function formatStackedAmount(amount: bigint, version: Version): string {
  if (version === "legacyV1") {
    // legacyV1 has 0 decimals - amount is the actual number
    return Number(amount).toLocaleString();
  }
  // legacyV2+ have 6 decimals
  return (Number(amount) / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
