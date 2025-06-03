import {
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { getLocalStorage } from "@stacks/connect";
import { FaMoon, FaSun } from "react-icons/fa";
import ClearData from "../auth/clear-data";
import SignIn from "../auth/sign-in";
import SignOut from "../auth/sign-out";
import CityCoinsLogo from "./citycoins-logo";

function Header() {
  const userData = getLocalStorage();
  const stxAddress = userData?.addresses?.stx[0].address
  const { colorMode, toggleColorMode } = useColorMode();

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
        {stxAddress === undefined ? (
          <SignIn variant="outline" />
        ) : (
          <SignOut variant="outline" />
        )}
        <IconButton
          aria-label="Learn More"
          title="Learn More"
          icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
          onClick={toggleColorMode}
        />
      </Stack>
    </Stack>
  );
}

export default Header;
