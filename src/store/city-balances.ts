import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { AddressBalanceResponse } from "@stacks/stacks-blockchain-api-types";
import { fancyFetch, HIRO_API } from "./common";
import { stxAddressAtom } from "./stacks";
import { getCityConfig, CITY_INFO } from "../config/city-config";

// Types
export interface CityBalances {
  v1: number;
  v2: number;
}

export interface CityEligibility {
  isEligible: boolean;
  hasChecked: boolean;
  isLoading: boolean;
}

// Atoms for MIA
export const miaBalancesAtom = atomWithStorage<CityBalances>("citycoins-mia-balances", { v1: 0, v2: 0 });
export const miaEligibilityAtom = atomWithStorage<CityEligibility>("citycoins-mia-eligibility", { isEligible: false, hasChecked: false, isLoading: false });

// Atoms for NYC
export const nycBalancesAtom = atomWithStorage<CityBalances>("citycoins-nyc-balances", { v1: 0, v2: 0 });
export const nycEligibilityAtom = atomWithStorage<CityEligibility>("citycoins-nyc-eligibility", { isEligible: false, hasChecked: false, isLoading: false });

// Derived atoms for formatted balances (v2 has 6 decimals)
export const miaFormattedBalancesAtom = atom((get) => {
  const balances = get(miaBalancesAtom);
  return {
    v1: balances.v1,
    v2: balances.v2 / 1000000,
  };
});

export const nycFormattedBalancesAtom = atom((get) => {
  const balances = get(nycBalancesAtom);
  return {
    v1: balances.v1,
    v2: balances.v2 / 1000000,
  };
});

// Updater function for eligibility check (call from button, updates atoms)
export function useCheckCityEligibility(city: 'mia' | 'nyc') {
  const setBalances = city === 'mia' ? useSetAtom(miaBalancesAtom) : useSetAtom(nycBalancesAtom);
  const setEligibility = city === 'mia' ? useSetAtom(miaEligibilityAtom) : useSetAtom(nycEligibilityAtom);
  const stxAddress = useAtomValue(stxAddressAtom);

  return async () => {
    if (!stxAddress) return;
    const config = getCityConfig(city);
    const assetId = CITY_INFO[city].symbol.toLowerCase();
    const v1Contract = `${config.legacyV1.token.deployer}.${config.legacyV1.token.contractName}::${assetId}`;
    const v2Contract = `${config.legacyV2.token.deployer}.${config.legacyV2.token.contractName}::${assetId}`;

    setEligibility(prev => ({ ...prev, isLoading: true }));

    try {
      const url = `${HIRO_API}/extended/v1/address/${stxAddress}/balances`;
      const data = await fancyFetch<AddressBalanceResponse>(url);
      const v1Balance = parseInt(data.fungible_tokens?.[v1Contract]?.balance || "0", 10);
      const v2Balance = parseInt(data.fungible_tokens?.[v2Contract]?.balance || "0", 10);

      setBalances({ v1: v1Balance, v2: v2Balance });
      const eligible = v1Balance > 0 || v2Balance > 0;
      setEligibility({ isEligible: eligible, hasChecked: true, isLoading: false });
      console.log(`Eligibility checked for ${city}:`, { v1Balance, v2Balance, eligible });
    } catch (error) {
      console.error(`Error checking eligibility for ${city}:`, error);
      setEligibility(prev => ({ ...prev, isLoading: false }));
    }
  };
}

// Updater to reset eligibility (e.g., on sign-out)
export function useResetCityEligibility(city: 'mia' | 'nyc') {
  const setEligibility = city === 'mia' ? useSetAtom(miaEligibilityAtom) : useSetAtom(nycEligibilityAtom);
  return () => setEligibility({ isEligible: false, hasChecked: false, isLoading: false });
}
