import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  IconButton,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaWindowClose } from "react-icons/fa";
import { useAtom } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ClearData from "./clear-data";
import SignOut from "./sign-out";
import { useBlockHeights } from "../../hooks/use-block-heights";

function Profile() {
  const calloutColor = useColorModeValue("gray.200", "gray.900");
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [storedStxAddress] = useAtom(stxAddressAtom);
  const { isLoading, data: blockHeights } = useBlockHeights();

  if (!storedStxAddress) {
    return null;
  }

  return (
    <>
      <Button variant="outline" title="View Profile" onClick={onOpen}>
        {storedStxAddress.slice(0, 5)}...{storedStxAddress.slice(-5)}
      </Button>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader display="flex" justifyContent="space-between">
            <IconButton
              variant="ghost"
              aria-label="Toggle color mode"
              title="Toggle color mode"
              icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
            />
            <IconButton
              variant="ghost"
              aria-label="Close"
              title="Close"
              icon={<FaWindowClose />}
              onClick={onClose}
            />
          </DrawerHeader>
          <DrawerBody>
            <Stack spacing={8}>
              <Heading size="lg" py={4} textAlign="center" bg={calloutColor}>
                {storedStxAddress.slice(0, 5)}...{storedStxAddress.slice(-5)}
              </Heading>
              <Stack direction="row">
                <Stat>
                  <StatLabel>Current Block</StatLabel>
                  <Skeleton isLoaded={!isLoading}>
                    <StatNumber>
                      {blockHeights && blockHeights.stx.toLocaleString()}
                    </StatNumber>
                  </Skeleton>
                </Stat>
                <Stat>
                  <StatLabel>Current Cycle</StatLabel>
                  <StatNumber>XX</StatNumber>
                </Stat>
              </Stack>
              <Heading size="md">Account Balances</Heading>
              <Text>TBD</Text>
              <Heading size="md">CityCoins User IDs</Heading>
              <Text>TBD</Text>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Stack
              w="100%"
              direction="row"
              alignItems="center"
              justifyContent="space-evenly"
              mt={8}
            >
              <SignOut variant="outline" />
              <ClearData variant="outline" />
            </Stack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default Profile;
