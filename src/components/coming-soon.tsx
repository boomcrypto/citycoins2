import { Link, Text } from "@chakra-ui/react";

function ComingSoon() {
  return (
    <>
      <Text fontWeight="bold">Coming Soon!</Text>
      <Text>
        Old interface available at{" "}
        <Link href="https://minecitycoins.com" target="_blank" rel="noopener noreferrer">
          minecitycoins.com
        </Link>
      </Text>
      <Text>
        Alternate interface available at{" "}
        <Link href="https://jing.cash" target="_blank" rel="noopener noreferrer">
          jing.cash
        </Link>
      </Text>
    </>
  );
}

export default ComingSoon;
