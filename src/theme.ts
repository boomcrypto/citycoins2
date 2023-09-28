import {
  extendTheme,
  type StyleFunctionProps,
  type ThemeConfig,
  createMultiStyleConfigHelpers,
} from "@chakra-ui/react";
import { tabsAnatomy } from "@chakra-ui/anatomy";
import { mode } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tabsAnatomy.keys);

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

const globalStyles = {
  ".spin": {
    animation: "spin 1s linear infinite",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
};

const linkStyles = {
  baseStyle: (props: StyleFunctionProps) => ({
    color: mode("blue.600", "blue.300")(props),
    _hover: {
      textDecoration: "underline",
    },
  }),
};

// Define the base component styles
const tabsBaseStyle = definePartsStyle({
  tab: {
    fontWeight: "semibold",
    _selected: (props: StyleFunctionProps) => ({
      borderTop: "5px solid",
      color: mode("blue.600", "blue.300")(props),
    }),
  },
});

// Export the component theme
export const tabsTheme = defineMultiStyleConfig({ baseStyle: tabsBaseStyle });

const theme = extendTheme({
  config,
  components: {
    Link: linkStyles,
    Tabs: tabsTheme,
  },
  fonts,
  styles: {
    global: globalStyles,
  },
});

export default theme;
