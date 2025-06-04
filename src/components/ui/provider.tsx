"use client"

import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import customThemeSystem from "../../theme";

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={customThemeSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
