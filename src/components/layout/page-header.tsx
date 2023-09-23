import {
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  useColorMode,
} from "@chakra-ui/react";
import { useAccount } from "@micro-stacks/react";
import CityCoinsLogo from "./citycoins-logo";
import SignIn from "../auth/sign-in";
import SignOut from "../auth/sign-out";
import ClearData from "../auth/clear-data";
import { stxAddressAtom } from "../../store/stacks";
import { useAtom } from "jotai";
import { FaChevronCircleDown, FaMoon, FaSun } from "react-icons/fa";
import Profile from "../auth/profile";

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
      <Profile />
      <Menu>
        <MenuButton
          as={Button}
          variant="outline"
          rightIcon={<FaChevronCircleDown />}
          title="Select City"
        >
          Select City
        </MenuButton>
        <MenuList>
          <MenuItem>Miami</MenuItem>
          <MenuItem>New York City</MenuItem>
        </MenuList>
      </Menu>
      <ClearData variant="outline" />
      {stxAddress === undefined ? (
        <SignIn variant="outline" />
      ) : (
        <SignOut variant="outline" />
      )}
      <IconButton
        aria-label="Toggle color mode"
        title="Toggle color mode"
        icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
        onClick={toggleColorMode}
      />
    </Stack>
  );
}

export default Header;
