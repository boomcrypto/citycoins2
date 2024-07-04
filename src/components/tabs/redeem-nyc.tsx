import { Heading, Stack } from "@chakra-ui/react";
import { atom, useAtomValue } from "jotai";

const v1BalanceNYCAtom = atom(0);
const v2BalanceNYCAtom = atom(0);

const totalBalanceNYCAtom = atom(
  (get) => get(v1BalanceNYCAtom) + get(v2BalanceNYCAtom)
);

const amountForBalanceAtom = atom(0);

function RedeemNYC() {
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const totalBalanceNYC = useAtomValue(totalBalanceNYCAtom);
  const amountForBalance = useAtomValue(amountForBalanceAtom);

  return (
    <Stack spacing={4}>
      <Heading>CityCoins NYC Redemption</Heading>
    </Stack>
  );
}

export default RedeemNYC;

/*

Need a button to refresh the information
- get V1 NYC balance
- get V2 NYC balance
- derive total balance w/ micro adaptation
- get amount for balance from contract

Need a button to redeem NYC
- post condition burn balances
- post condition receive STX

Need a button to redeem NYC for stSTX / liSTX.
- disclaimer/pop-up for the user to understand the risks
- link to their official websites, documentation, chat rooms
- post condition depends on which asset
  - stSTX has a function we can call to get amount
  - liSTX mints an NFT so no need for post condition

stSTX calculation:

> To get the ststx/stx ratio you can call `get-stx-per-ststx` on `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v1`. The param `reserve-contract` should be `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1`.
> 
> It will currently return `u1015555`. Meaning for 1.015555 STX you will get 1 stSTX.

stackingDAO wrapper:
https://explorer.hiro.so/txid/SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.cc-redemption-v1?chain=mainnet

*/
