import {
  extendTheme,
  type StyleFunctionProps,
  type ThemeConfig,
} from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

// Chakra theme configuration
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
  cssVarPrefix: "citycoin",
};

const fonts = {
  heading: "Open Sans, sans-serif",
  body: "Open Sans, sans-serif",
};

const components = {
  Link: {
    baseStyle: (props: StyleFunctionProps) => ({
      color: mode("blue.600", "blue.300")(props),
      _hover: {
        textDecoration: "underline",
      },
    }),
  },
};

const theme = extendTheme({ config, components, fonts });

export default theme;
