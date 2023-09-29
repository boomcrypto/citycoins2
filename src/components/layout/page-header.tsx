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
import { useAtom } from "jotai";
import { useCalloutColor } from "../../hooks/use-callout-color";

function Header() {
  const calloutColor = useCalloutColor();
  const { stxAddress } = useAccount();
  const [selectedCity, setSelectedCity] = useAtom(citycoinsSelectedCityAtom);

  const handleCitySelect = (cityKey: CityKeys) => {
    setSelectedCity(cityKey);
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
          <MenuItem
            fontWeight="bold"
            onClick={() => handleCitySelect("mia")}
            backgroundColor={selectedCity === "mia" ? calloutColor : ""}
          >
            Miami
          </MenuItem>
          <MenuItem
            fontWeight="bold"
            onClick={() => handleCitySelect("nyc")}
            backgroundColor={selectedCity === "nyc" ? calloutColor : ""}
          >
            New York City
          </MenuItem>
        </MenuList>
      </Menu>
    </Stack>
  );
}

export default Header;
