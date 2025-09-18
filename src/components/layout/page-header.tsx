import {
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { getLocalStorage } from "@stacks/connect";
import { FaMoon, FaSun } from "react-icons/fa";
import ClearData from "../auth/clear-data";
import SignIn from "../auth/sign-in";
import SignOut from "../auth/sign-out";
import CityCoinsLogo from "./citycoins-logo";
import { useAtom, useAtomValue } from "jotai";
import { stxAddressAtom } from "../../store/stacks";

function Header() {
  const stxAddress = useAtomValue(stxAddressAtom);
  //console.log("STX Address:", stxAddress);
  return (
    <Stack align="center" direction={["column", "row"]} p={4}>
      <Flex flexGrow="1" align="center">
        <CityCoinsLogo width="45px" height="45px" />
        <Heading size="md" ml={2}>
          CityCoins
        </Heading>
      </Flex>
      <Stack direction={["column", "row"]} alignItems="center">
        <Text fontWeight="semibold" fontSize="md">
          {stxAddress
            ? `${stxAddress.slice(0, 5)}...${stxAddress.slice(-5)}`
            : ""}
        </Text>
        <ClearData variant="outline" />
        {!stxAddress ? (
          <SignIn variant="outline" />
        ) : (
          <SignOut variant="outline" />
        )}
      </Stack>
    </Stack>
  );
}

export default Header;
