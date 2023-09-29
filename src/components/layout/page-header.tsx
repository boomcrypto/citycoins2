import {
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
} from "@chakra-ui/react";
import { useAccount } from "@micro-stacks/react";
import { FaChevronCircleDown } from "react-icons/fa";
import CityCoinsLogo from "./citycoins-logo";
import Profile from "../auth/profile";
import SignIn from "../auth/sign-in";
import { CityKeys, citycoinsSelectedCityAtom } from "../../store/citycoins";
import { useSetAtom } from "jotai";

function Header() {
  const { stxAddress } = useAccount();
  const setCity = useSetAtom(citycoinsSelectedCityAtom);

  const handleCitySelect = (cityKey: CityKeys) => {
    setCity(cityKey);
  };

  return (
    <Stack align="center" direction={["column", "row"]} p={4}>
      <Flex flexGrow="1" align="center">
        <CityCoinsLogo width="45px" height="45px" />
        <Heading size="md" ml={2}>
          CityCoins
        </Heading>
      </Flex>
      {stxAddress === undefined ? <SignIn /> : <Profile />}
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
          <MenuItem onClick={() => handleCitySelect("mia")}>Miami</MenuItem>
          <MenuItem onClick={() => handleCitySelect("nyc")}>
            New York City
          </MenuItem>
        </MenuList>
      </Menu>
    </Stack>
  );
}

export default Header;
