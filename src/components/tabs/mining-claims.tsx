import { Heading, Stack, Text } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";
import { miningClaimTransactionsAtom } from "../../store/citycoins";

function MiningClaims() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const miningClaimTransactions = useAtomValue(miningClaimTransactionsAtom);

  if (!stxAddress) {
    return (
      <Stack gap={4}>
        <Heading>CityCoins Mining Claims</Heading>
        <Text>Wallet connection required to access mining claims.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Heading>CityCoins Mining Claims</Heading>
      <TransactionList transactions={miningClaimTransactions} />
    </Stack>
  );
}

export default MiningClaims;
