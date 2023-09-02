import { Heading, Stack } from "@chakra-ui/react";
import ComingSoon from "../coming-soon";

function Dashboard() {
  return (
    <Stack spacing={4}>
      <Heading>CityCoins Dashboard</Heading>
      <ComingSoon />
    </Stack>
  );
}

export default Dashboard;
