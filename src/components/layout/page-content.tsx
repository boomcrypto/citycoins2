import { Box } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { activeTabAtom } from "../../store/common";
import Voting from "../tabs/voting";
import Mia from "../tabs/mia";
import Nyc from "../tabs/nyc";
import { Transaction } from "@stacks/stacks-blockchain-api-types";

interface ContentProps {
  onOpenDetails: (tx: Transaction) => void;
}

function Content({ onOpenDetails }: ContentProps) {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <Box width="100%" maxW="1200px">
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="outline" fitted>
        <Tabs.List>
          <Tabs.Trigger value="voting">Voting</Tabs.Trigger>
          <Tabs.Trigger value="mia">MIA</Tabs.Trigger>
          <Tabs.Trigger value="nyc">NYC</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="voting"><Voting /></Tabs.Content>
        <Tabs.Content value="mia"><Mia onOpenDetails={onOpenDetails} /></Tabs.Content>
        <Tabs.Content value="nyc"><Nyc onOpenDetails={onOpenDetails} /></Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

export default Content;
