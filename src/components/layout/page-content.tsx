import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { activeTabAtom } from "../../store/common";
import { stxAddressAtom } from "../../store/stacks";
import Dashboard from "../tabs/dashboard";
import MiningClaims from "../tabs/mining-claims";
import StackingClaims from "../tabs/stacking-claims";
import Voting from "../tabs/voting";
import ConnectWallet from "../auth/connect-wallet";

function Content() {
  const stxAddress = useAtomValue(stxAddressAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  if (!stxAddress) {
    return (
      <Box width="100%" maxW="1200px">
        <ConnectWallet />
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
          <Tab>Mining Claims</Tab>
          <Tab>Stacking Claims</Tab>
          <Tab>Voting</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Dashboard />
          </TabPanel>
          <TabPanel>
            <MiningClaims />
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
