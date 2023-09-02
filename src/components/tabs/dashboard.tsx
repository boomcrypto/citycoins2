import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import ComingSoon from "../coming-soon";

function Dashboard() {
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Dashboard</Heading>
      <ComingSoon />
      <Text>
        Mining statistics also available at{" "}
        <Link isExternal href="https://miamining.com">
          miamining.com
        </Link>{" "}
        and{" "}
        <Link isExternal href="https://mining.nyc">
          mining.nyc
        </Link>
      </Text>
    </Stack>
  );
}

export default Dashboard;
