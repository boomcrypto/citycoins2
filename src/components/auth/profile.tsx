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
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { stxAddressAtom } from "../../store/stacks";

function Profile() {
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
            {storedStxAddress.slice(0, 5)}...{storedStxAddress.slice(-5)}
          </DrawerHeader>
          <DrawerBody>
            <Heading size="md">Account Balances</Heading>
            <Text>TBD</Text>
            <Heading size="md">CityCoins User IDs</Heading>
            <Text>TBD</Text>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue">Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default Profile;
