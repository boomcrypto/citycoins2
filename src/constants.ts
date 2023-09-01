import { atomWithStorage } from "jotai/utils";

/////////////////////////
// CONSTANTS
/////////////////////////

export const registrationSteps = [
  { title: "Connect Wallet", description: "Step 1" },
  { title: "Designate BTC", description: "Step 2" },
  { title: "Sign Message", description: "Step 3" },
  { title: "Send Dust", description: "Step 4" },
];

// https://docs.1btc.chat/1btc-chat-api
export const apiUrl = "https://1btc-api.console.xyz";

/////////////////////////
// TYPES
/////////////////////////

// signature message returned from the API
export type SignatureMessage = {
  msg: string;
};

// registration data returned from the API
// https://1btc-api.console.xyz/register-hiro
export type AccountData = {
  owner: string;
  receiveAddress: string;
  origin: string | null;
  status: "pending" | "valid" | "insufficient" | "duplicate";
};

/////////////////////////
// LOCAL STORAGE ATOMS
// updated by components
// used to persist on close/open
/////////////////////////

export const activeTabAtom = atomWithStorage<number>(
  "citycoins-ui-activeTab",
  0
);

// stacks address from wallet
export const stxAddressAtom = atomWithStorage<string | null>(
  "citycoins-ui-stxAddress",
  null
);

/////////////////////////
// ATOMS
// updated by components
// used to trigger API calls
/////////////////////////

// TBD

/////////////////////////
// LOADABLE ASYNC ATOMS
// updated by API calls
/////////////////////////

// TBD

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

// TBD
