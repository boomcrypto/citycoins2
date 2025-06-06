import { Box, Tabs, TabsTrigger } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { activeTabAtom } from "../../store/common";
import Dashboard from "../tabs/dashboard";
import MiningClaims from "../tabs/mining-claims";
import StackingClaims from "../tabs/stacking-claims";
import Voting from "../tabs/voting";

function Content() {
  //const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <Box width="100%" maxW="1200px">
      <Voting />
    </Box >
  );
}

export default Content;
