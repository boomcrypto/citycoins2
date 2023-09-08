import {
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { useAccount } from "@micro-stacks/react";
import CityCoinsLogo from "./citycoins-logo";
import SignIn from "../auth/sign-in";
import SignOut from "../auth/sign-out";
import ClearData from "../auth/clear-data";
import { stxAddressAtom } from "../../constants";
import { useAtom } from "jotai";
import { FaMoon, FaSun } from "react-icons/fa";

function Header() {
  const { stxAddress } = useAccount();
  const { colorMode, toggleColorMode } = useColorMode();
  const [storedStxAddress] = useAtom(stxAddressAtom);

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
          {stxAddress === undefined && storedStxAddress
            ? `${storedStxAddress.slice(0, 5)}...${storedStxAddress.slice(-5)}`
            : stxAddress
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
