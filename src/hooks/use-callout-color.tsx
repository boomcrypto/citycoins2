import { useColorModeValue } from "@chakra-ui/react";

export const useCalloutColor = () => {
  return useColorModeValue("blue.400", "blue.600");
};
