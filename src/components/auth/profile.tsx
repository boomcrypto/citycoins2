import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  IconButton,
  Stack,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useAtom } from "jotai";
import { stxAddressAtom } from "../../store/stacks";
import ClearData from "./clear-data";
import SignOut from "./sign-out";

function Profile() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [storedStxAddress] = useAtom(stxAddressAtom);

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
          <DrawerCloseButton />
          <DrawerHeader>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mt={8}
            >
              <SignOut variant="outline" />
              <ClearData variant="outline" />
              <IconButton
                variant="outline"
                aria-label="Toggle color mode"
                title="Toggle color mode"
                icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
              />
            </Stack>
          </DrawerHeader>
          <DrawerBody>
            <Stack spacing={8}>
              <Heading size="lg" textAlign="center">
                {storedStxAddress.slice(0, 5)}...{storedStxAddress.slice(-5)}
              </Heading>
              <Heading size="md">Account Balances</Heading>
              <Text>TBD</Text>
              <Heading size="md">CityCoins User IDs</Heading>
              <Text>TBD</Text>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default Profile;
