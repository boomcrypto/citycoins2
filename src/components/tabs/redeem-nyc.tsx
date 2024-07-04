import {
  Heading,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  VStack,
  HStack,
  Stack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Link,
  Divider,
} from "@chakra-ui/react";
import { atom, useAtomValue } from "jotai";
import { LuExternalLink, LuRepeat } from "react-icons/lu";

const v1BalanceNYCAtom = atom(0);
const v2BalanceNYCAtom = atom(0);

const totalBalanceNYCAtom = atom(
  (get) => get(v1BalanceNYCAtom) + get(v2BalanceNYCAtom)
);

const amountForBalanceAtom = atom(0);

function RedeemNYC() {
  const v1BalanceNYC = useAtomValue(v1BalanceNYCAtom);
  const v2BalanceNYC = useAtomValue(v2BalanceNYCAtom);
  const totalBalanceNYC = useAtomValue(totalBalanceNYCAtom);
  const amountForBalance = useAtomValue(amountForBalanceAtom);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const refreshBalances = () => {
    // Implement the logic to refresh balances here
    console.log("Refreshing balances...");
  };

  const redeemNYC = () => {
    // Implement the logic to redeem NYC here
    console.log("Redeeming NYC...");
  };

  const redeemForStSTX = () => {
    // Implement the logic to redeem for stSTX here
    console.log("Redeeming for stSTX...");
    onClose();
  };

  const redeemForLiSTX = () => {
    // Implement the logic to redeem for liSTX here
    console.log("Redeeming for liSTX...");
    onClose();
  };

  return (
    <VStack spacing={8} align="stretch">
      <Heading>CityCoins NYC Redemption</Heading>

      <Button leftIcon={<LuRepeat />} onClick={refreshBalances}>
        Refresh Balances
      </Button>

      <StatGroup>
        <Stat>
          <StatLabel>V1 NYC Balance</StatLabel>
          <StatNumber>{v1BalanceNYC}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>V2 NYC Balance</StatLabel>
          <StatNumber>{v2BalanceNYC}</StatNumber>
        </Stat>
      </StatGroup>

      <StatGroup>
        <Stat>
          <StatLabel>Total NYC Balance</StatLabel>
          <StatNumber>{totalBalanceNYC}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Amount for Balance</StatLabel>
          <StatNumber>{amountForBalance}</StatNumber>
        </Stat>
      </StatGroup>

      <Stack spacing={4} direction={["column", null, "row"]}>
        <Button onClick={redeemNYC} width="full">
          Redeem for STX
        </Button>
        <Button onClick={onOpen} width="full">
          Redeem for stSTX / liSTX
        </Button>
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Redeem NYC for stSTX / liSTX</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              If you would like to claim and stack in the same transaction,{" "}
              <Link href="https://www.stackingdao.com/" isExternal>
                StackingDAO
              </Link>{" "}
              and{" "}
              <Link href="https://www.lisalab.io/" isExternal>
                LISA
              </Link>{" "}
              have partnered to offer stSTX and liSTX.
            </Text>
            <Text mb={4}>
              Please review the resources below before proceeding to fully
              understand the process through their platform.
            </Text>
            <Text mb={4}>
              Please be aware of the risks associated with redeeming for stSTX
              or liSTX. StackingDAO and LISA are not affiliated with CityCoins.
            </Text>
            <Divider my={4} />
            <VStack align="stretch" spacing={2} textAlign="center">
              <Text fontWeight="bold">Official Resources:</Text>
              <Link
                noOfLines={1}
                href="https://www.stackingdao.com/"
                isExternal
              >
                StackingDAO Website <LuExternalLink />
              </Link>
              <Link href="https://discord.gg/stackingdao" isExternal>
                StackingDAO Discord <LuExternalLink />
              </Link>
              <Link href="https://lidofinance.io/" isExternal>
                Lido Finance Website <LuExternalLink />
              </Link>
              <Link href="https://discord.gg/lido" isExternal>
                Lido Finance Discord <LuExternalLink />
              </Link>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4}>
              <Button colorScheme="blue" onClick={redeemForStSTX}>
                Redeem for stSTX
              </Button>
              <Button colorScheme="green" onClick={redeemForLiSTX}>
                Redeem for liSTX
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

export default RedeemNYC;
