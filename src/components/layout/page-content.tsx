import {
  Box,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { activeTabAtom, stxAddressAtom } from "../../constants";
import SignIn from "../auth/sign-in";
import Dashboard from "../tabs/dashboard";
import Mining from "../tabs/mining";
import MiningClaims from "../tabs/mining-claims";
import Stacking from "../tabs/stacking";
import StackingClaims from "../tabs/stacking-claims";
import Voting from "../tabs/voting";

function Content() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  if (!stxAddress) {
    return (
      <Box width="100%" maxW="1200px">
        <Stack gap={8}>
          <Heading>CityCoins</Heading>
          <SignIn />
        </Stack>
      </Box>
    );
  }

  return (
    <Box width="100%" maxW="1200px">
      <Tabs
        variant="enclosed"
        onChange={(index) => setActiveTab(index)}
        defaultIndex={activeTab}
        isFitted
      >
        <TabList
          overflowY="scroll"
          whiteSpace="nowrap"
          sx={{
            "::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <Tab>Dashboard</Tab>
          <Tab>Mining</Tab>
          <Tab>Mining Claims</Tab>
          <Tab>Stacking</Tab>
          <Tab>Stacking Claims</Tab>
          <Tab>Voting</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Dashboard />
          </TabPanel>
          <TabPanel>
            <Mining />
          </TabPanel>
          <TabPanel>
            <MiningClaims />
          </TabPanel>
          <TabPanel>
            <Stacking />
          </TabPanel>
          <TabPanel>
            <StackingClaims />
          </TabPanel>
          <TabPanel>
            <Voting />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default Content;
