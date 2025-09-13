import { Flex, Separator } from "@chakra-ui/react";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";
import Header from "./components/layout/page-header";
import { Provider } from "./components/ui/provider";
import { useState } from "react";
import TransactionDetailsDialog from "./components/transaction-details-dialog";
import { Transaction } from "@stacks/stacks-blockchain-api-types";

export const App = () => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const onOpenDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setSelectedTx(null);
  };

  return (
    <Provider>
      <Flex direction="column" minH="100vh">
        <Header />
        <Separator />
        <Flex
          flex="1"
          alignItems="flex-start"
          justifyContent="center"
          my={16}
          mx={[2, 8]}
        >
          <Content onOpenDetails={onOpenDetails} />
        </Flex>
        <Separator />
        <Footer />
      </Flex>
      <TransactionDetailsDialog
        tx={selectedTx}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Provider>
  );
};
