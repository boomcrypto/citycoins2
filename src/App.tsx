import { ChakraProvider, Divider, Flex } from "@chakra-ui/react";
import theme from "./theme";
import Header from "./components/layout/page-header";
import Content from "./components/layout/page-content";
import Footer from "./components/layout/page-footer";

export const App = () => (
  <ChakraProvider theme={theme}>
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
  </ChakraProvider>
);
