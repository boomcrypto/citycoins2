import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Chakra theme configuration
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
  cssVarPrefix: "citycoin",
};

const fonts = {
  heading: "Open Sans, sans-serif",
  body: "Open Sans, sans-serif",
};

const theme = extendTheme({ config, fonts });

export default theme;
