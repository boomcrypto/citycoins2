/**
 * City-specific claims configuration for redemption and display
 */

import { CityName } from "./city-config";
import type { CityClaimsConfig } from "../components/claims/types";

export const CITY_CLAIMS_CONFIG: Record<CityName, CityClaimsConfig> = {
  mia: {
    cityName: "mia",
    displayName: "Miami",
    symbol: "MIA",
    assetId: "miamicoin",
    v1Contract: "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token",
    v2Contract: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2",
    redemptionContract: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-mia",
    redemptionFunction: "redeem-mia",
    ccipLink: {
      text: "CCIP-026",
      href: "https://github.com/citycoins/governance/pull/50",
    },
    pendingApproval: true,
  },
  nyc: {
    cityName: "nyc",
    displayName: "New York City",
    symbol: "NYC",
    assetId: "newyorkcitycoin",
    v1Contract: "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token",
    v2Contract: "SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2",
    redemptionContract: "SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccd012-redemption-nyc",
    redemptionFunction: "redeem-nyc",
    ccipLink: {
      text: "CCIP-022",
      href: "https://github.com/citycoins/governance/blob/main/ccips/ccip-022/ccip-022-citycoins-treasury-redemption-nyc.md",
    },
    pendingApproval: false,
  },
};
