import { Box, Tabs, TabsTrigger } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { activeTabAtom } from "../../store/common";
import Dashboard from "../tabs/dashboard";
import MiningClaims from "../tabs/mining-claims";
import StackingClaims from "../tabs/stacking-claims";
import Voting from "../tabs/voting";

function Content() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <Box width="100%" maxW="1200px">
      <Tabs.Root
        defaultValue="voting"
        variant="enclosed"
        isFitted
      >
        <Tabs.List>
          <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
          <Tabs.Trigger value="mining">Mining Claims</Tabs.Trigger>
          <Tabs.Trigger value="stacking">Stacking Claims</Tabs.Trigger>
          <Tabs.Trigger value="voting">Voting</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="dashboard">
          <Dashboard />
        </Tabs.Content>

        <Tabs.Content value="mining">
          <MiningClaims />
        </Tabs.Content>

        <Tabs.Content value="stacking">
          <StackingClaims />
        </Tabs.Content>

        <Tabs.Content value="voting">
          <Voting />
        </Tabs.Content>

      </Tabs.Root>
    </Box >
  );
}

export default Content;
