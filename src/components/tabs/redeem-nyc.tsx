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
  useToast,
} from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { LuExternalLink, LuRepeat } from "react-icons/lu";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";
import {
  redemptionForBalanceAtom,
  totalBalanceNYCAtom,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../../store/ccd-012";
import { formatAmount, formatMicroAmount } from "../../store/common";
import { useCcd012RedeemNyc } from "../../hooks/use-ccd-012";

function RedeemNYC() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const stxAddress = useAtomValue(stxAddressAtom);
  const [v1BalanceNYC, setV1BalanceNyc] = useAtom(v1BalanceNYCAtom);
  const [v2BalanceNYC, setV2BalanceNyc] = useAtom(v2BalanceNYCAtom);
  const totalBalanceNYC = useAtomValue(totalBalanceNYCAtom);
  const [redemptionForBalance, setRedemptionForBalance] = useAtom(
    redemptionForBalanceAtom
  );

  const { redeemNycCall, isRequestPending } = useCcd012RedeemNyc();

  const refreshBalances = () => {
    toast({
      title: "Refreshing balances...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    console.log("Refreshing balances...");
    setV1BalanceNyc();
    setV2BalanceNyc();
    setRedemptionForBalance();
  };

  const redeemNYC = () => {
    toast({
      title: "Redeeming NYC...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    console.log("Redeeming NYC...");
    redeemNycCall();
  };

  const redeemForStSTX = () => {
    toast({
      title: "Redeeming NYC for stSTX...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    console.log("Redeeming NYC for stSTX...");
    onClose();
  };

  const redeemForLiSTX = () => {
    toast({
      title: "Redeeming NYC for liSTX...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    console.log("Redeeming NYC for liSTX...");
    onClose();
  };

  if (!stxAddress) {
    return (
      <Stack spacing={4}>
        <Heading>CityCoins NYC Redemption</Heading>
        <Text>Wallet connection required to access redemption.</Text>
        <SignIn />
      </Stack>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Heading>CityCoins NYC Redemption</Heading>

      <Button leftIcon={<LuRepeat />} onClick={refreshBalances}>
        Refresh Balances
      </Button>

      <StatGroup>
        <Stat>
          <StatLabel>V1 NYC Balance</StatLabel>
          {v1BalanceNYC ? (
            <StatNumber>{formatAmount(v1BalanceNYC)}</StatNumber>
          ) : (
            <Text mt={2} fontSize="small">
              (none detected)
            </Text>
          )}
        </Stat>
        <Stat>
          <StatLabel>V2 NYC Balance</StatLabel>
          {v2BalanceNYC ? (
            <StatNumber>{formatMicroAmount(v2BalanceNYC)}</StatNumber>
          ) : (
            <Text mt={2} fontSize="small">
              (none detected)
            </Text>
          )}
        </Stat>
      </StatGroup>

      <StatGroup>
        <Stat>
          <StatLabel>Total NYC Balance</StatLabel>
          <StatNumber>{formatMicroAmount(totalBalanceNYC)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Amount for Balance</StatLabel>
          {redemptionForBalance ? (
            <StatNumber>{formatMicroAmount(redemptionForBalance)}</StatNumber>
          ) : (
            <Text mt={2} fontSize="small">
              (none detected)
            </Text>
          )}
        </Stat>
      </StatGroup>

      <Stack spacing={4} direction={["column", null, "row"]}>
        <Button isLoading={isRequestPending} onClick={redeemNYC} width="full">
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
