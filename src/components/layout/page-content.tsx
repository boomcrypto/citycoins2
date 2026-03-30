import { Box } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { activeTabAtom } from "../../store/common";
import {
  stxAddressAtom,
  transactionsAtom,
  transactionFetchStatusAtom,
} from "../../store/stacks";
import Voting from "../tabs/voting";
import Mia from "../tabs/mia";
import Nyc from "../tabs/nyc";
function Content() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const stxAddress = useAtomValue(stxAddressAtom);
  const transactions = useAtomValue(transactionsAtom);
  const fetchStatus = useAtomValue(transactionFetchStatusAtom);
  const [, updateTransactions] = useAtom(transactionsAtom);
  const hasInitialized = useRef(false);

  // On mount, if user is logged in and we don't have transactions loading,
  // trigger a fetch to ensure we have fresh data
  useEffect(() => {
    if (
      stxAddress &&
      !fetchStatus.isLoading &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      // Pass existing transactions to allow incremental fetch
      updateTransactions(transactions);
    }
  }, [stxAddress, fetchStatus.isLoading, transactions, updateTransactions]);

  return (
    <Box width="100%" maxW="1200px">
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="outline" fitted>
        <Tabs.List>
          <Tabs.Trigger value="voting">Voting</Tabs.Trigger>
          <Tabs.Trigger value="mia">MIA</Tabs.Trigger>
          <Tabs.Trigger value="nyc">NYC</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="voting"><Voting /></Tabs.Content>
        <Tabs.Content value="mia"><Mia /></Tabs.Content>
        <Tabs.Content value="nyc"><Nyc /></Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

export default Content;
