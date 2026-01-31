import { Flex, Separator } from "@chakra-ui/react";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";
import Header from "./components/layout/page-header";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { useStorageMonitor } from "./hooks/use-storage-monitor";

/**
 * Inner app content with storage monitoring hook
 */
const AppContent = () => {
  // Monitor localStorage usage and show warnings
  useStorageMonitor();

  return (
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
        <Content />
      </Flex>
      <Separator />
      <Footer />
    </Flex>
  );
};

export const App = () => {
  return (
    <Provider>
      <AppContent />
      <Toaster />
    </Provider>
  );
};
