import { Link, Text } from "@chakra-ui/react";

function ComingSoon() {
  return (
    <>
      <Text fontWeight="bold">Coming Soon!</Text>
      <Text>
        Old interface available at{" "}
        <Link isExternal href="https://minecitycoins.com">
          minecitycoins.com
        </Link>
      </Text>
      <Text>
        Alternate interface available at{" "}
        <Link isExternal href="https://jing.cash">
          jing.cash
        </Link>
      </Text>
    </>
  );
}

export default ComingSoon;
