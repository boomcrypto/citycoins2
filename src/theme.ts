import { createSystem, defaultConfig } from "@chakra-ui/react";

const fonts = {
  heading: { value: "Open Sans, sans-serif" },
  body: { value: "Open Sans, sans-serif" },
};

const config = {
  theme: {
    tokens: {
      fonts,
    },
  },
};

export default createSystem(defaultConfig, config);
