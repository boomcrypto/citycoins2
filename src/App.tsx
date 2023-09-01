import { ChakraProvider, Divider, Flex } from "@chakra-ui/react";
import { ClientProvider } from "@micro-stacks/react";
import theme from "./theme";
import Header from "./components/layout/page-header";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";
import { useNoWalletFound } from "./hooks/use-no-wallet-found";

export const App = () => (
  <ChakraProvider theme={theme}>
    <ClientProvider
      appName="CityCoins"
      network="mainnet"
      appIconUrl={`${window.origin}/citycoins-logo-circle-512.png`}
      onNoWalletFound={useNoWalletFound()}
    >
      <Flex direction="column" minH="100vh">
        <Header />
        <Divider />
        <Flex
          flex="1"
          alignItems="flex-start"
          justifyContent="center"
          my={16}
          mx={[2, 8]}
        >
          <Content />
        </Flex>
        <Divider />
        <Footer />
      </Flex>
    </ClientProvider>
  </ChakraProvider>
);
