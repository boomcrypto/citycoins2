import { useColorModeValue } from "@chakra-ui/react";

export const useCalloutColor = () => {
  return useColorModeValue("blue.300", "blue.600");
};
