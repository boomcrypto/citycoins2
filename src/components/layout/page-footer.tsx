import { Button, Flex, Heading } from "@chakra-ui/react";
import CityCoinsLogo from "./citycoins-logo";

function Footer() {
  return (
    <Flex align="center" direction={["column-reverse", "row"]} p={4}>
      <Flex flexGrow="1" align="center">
        <CityCoinsLogo width="45px" height="45px" />
        <Heading size="md" ml={2}>
          CityCoins
        </Heading>
      </Flex>
      <Button
        asChild
        title="About"
        variant="ghost"
      >
        <a href="https://citycoins.co" target="_blank" rel="noopener noreferrer">
          About
        </a>
      </Button>
      <Button
        asChild
        title="GitHub"
        variant="ghost"
      >
        <a href="https://github.com/citycoins" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </Button>
    </Flex>
  );
}

export default Footer;
