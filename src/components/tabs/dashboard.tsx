import {
  Heading,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { stxAddressAtom } from "../../store/stacks";
import { useAtomValue } from "jotai";
import SignIn from "../auth/sign-in";
import TransactionList from "../transaction-list";

function Dashboard() {
  const stxAddress = useAtomValue(stxAddressAtom);

  return (
    <Stack spacing={4}>
      <Heading>CityCoins Dashboard</Heading>
      {stxAddress ? (
        <>
          <Text fontWeight="bold">{stxAddress}</Text>
          <Stack direction={["column", null, "row"]}>
            <Stat>
              <StatLabel>Total Transactions</StatLabel>
              <StatNumber>XXX</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Mining TXs</StatLabel>
              <StatNumber>XXX</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Mining Claim TXs</StatLabel>
              <StatNumber>XXX</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Stacking TXs</StatLabel>
              <StatNumber>XXX</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Stacking Claim TXs</StatLabel>
              <StatNumber>XXX</StatNumber>
            </Stat>
          </Stack>
          <Stack>
            <Text>Recent Transactions:</Text>
            <TransactionList />
          </Stack>
        </>
      ) : (
        <>
          <Text>Wallet connection required to access dashboard.</Text>
          <SignIn />
        </>
      )}
    </Stack>
  );
}

export default Dashboard;
