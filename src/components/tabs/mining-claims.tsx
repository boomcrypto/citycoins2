import {
  Heading,
  IconButton,
  Link,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";

import { FaQuestion } from "react-icons/fa";
import MiningClaimsForm from "../mining/mining-claims-form";

function MiningClaims() {
  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="space-betwen">
        <Heading>CityCoins Mining Claims</Heading>
        <Spacer />
        <IconButton
          aria-label="Mining Claim Info"
          title="Mining Claim Info"
          icon={<FaQuestion />}
          as="a"
          href="https://docs.citycoins.co/core-protocol/mining-citycoins#claiming-rewards"
          target="_blank"
          rel="noopener noreferrer"
        />
      </Stack>
      <Text>
        Mining claims are based on the block height of the transaction, and a
        winner cannot be verified until 100 Stacks blocks pass from the block
        mined (~16 hours).
      </Text>
      <Text>
        Search for mining blocks to claim below. Each claim requires an
        individual transaction.
      </Text>
      <Text>
        Search for your address in the{" "}
        <Link isExternal href="https://explorer.hiro.so">
          Stacks Explorer
        </Link>{" "}
        to view previous mining transactions.
      </Text>
      <MiningClaimsForm />
    </Stack>
  );
}

export default MiningClaims;
