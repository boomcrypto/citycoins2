import { Button, Flex, Heading } from "@chakra-ui/react";
import CityCoinsLogo from "./citycoins-logo";

function Footer() {
  return (
    <Flex align="center" direction={["column", "row"]} p={4}>
      <Flex flexGrow="1" align="center">
        <CityCoinsLogo width="45px" height="45px" />
        <Heading size="md" ml={2}>
          CityCoins
        </Heading>
      </Flex>
      <Button
        as="a"
        title="About"
        variant="ghost"
        href="https://citycoins.co"
        target="_blank"
        rel="noopener noreferrer"
      >
        About
      </Button>
      <Button
        as="a"
        title="GitHub"
        variant="ghost"
        href="https://github.com/citycoins"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </Button>
    </Flex>
  );
}

export default Footer;
