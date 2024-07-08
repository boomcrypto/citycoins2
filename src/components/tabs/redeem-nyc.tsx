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
  Checkbox,
} from "@chakra-ui/react";
import { atom, useAtom, useAtomValue } from "jotai";
import { LuExternalLink, LuRepeat } from "react-icons/lu";
import SignIn from "../auth/sign-in";
import { stxAddressAtom } from "../../store/stacks";
import {
  ccd012TxIdAtom,
  redemptionForBalanceAtom,
  totalBalanceNYCAtom,
  v1BalanceNYCAtom,
  v2BalanceNYCAtom,
} from "../../store/ccd-012";
import { formatAmount, formatMicroAmount } from "../../store/common";
import {
  useCcd012RedeemNyc,
  useCcd012StackingDao,
  useCcd012Lisa,
} from "../../hooks/use-ccd-012";

const consentCheckedAtom = atom(false);

function RedeemNYC() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [consentChecked, setConsentChecked] = useAtom(consentCheckedAtom);

  const stxAddress = useAtomValue(stxAddressAtom);
  const [v1BalanceNYC, setV1BalanceNyc] = useAtom(v1BalanceNYCAtom);
  const [v2BalanceNYC, setV2BalanceNyc] = useAtom(v2BalanceNYCAtom);
  const totalBalanceNYC = useAtomValue(totalBalanceNYCAtom);
  const [redemptionForBalance, setRedemptionForBalance] = useAtom(
    redemptionForBalanceAtom
  );
  const ccd012TxId = useAtomValue(ccd012TxIdAtom);

  const { redeemNycCall, isRequestPending } = useCcd012RedeemNyc();
  const { stackingDaoCall, isRequestPending: isRequestPendingStackingDAO } =
    useCcd012StackingDao();
  const { lisaCall, isRequestPending: isRequestPendingLisa } = useCcd012Lisa();

  const refreshBalances = () => {
    toast({
      title: "Refreshing balances...",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
      variant: "solid",
    });
    console.log("Refreshing balances...");
    setV1BalanceNyc();
    setV2BalanceNyc();
    setRedemptionForBalance();
  };

  const readyToRedeem = () => {
    let toastMsg = "";
    if (!consentChecked) {
      toastMsg = "Please read and acknowledge the disclaimer.";
    }
    if (!stxAddress) {
      toastMsg =
        "No STX address detected, please log out and reconnect your wallet.";
    }
    if (!v1BalanceNYC || !v2BalanceNYC) {
      toastMsg =
        "No NYC balance detected, please refresh balances and try again.";
    }
    if (!redemptionForBalance) {
      toastMsg =
        "Unable to compute redemption amount, please refresh balances and try again.";
    }
    // a little hacky, but works if msg above was never set = no error
    if (toastMsg === "") return true;
    // else display msg and exit false
    toast({
      title: "Redemption Preparation Error",
      description: toastMsg,
      status: "warning",
      isClosable: true,
      position: "top",
      variant: "solid",
    });
    return false;
  };

  const redeemNYC = () => {
    toast({
      title: "Redeeming NYC...",
      status: "info",
      isClosable: true,
      position: "top",
      variant: "solid",
    });
    console.log("Redeeming NYC...");
    readyToRedeem() && redeemNycCall();
  };

  const redeemForStSTX = () => {
    toast({
      title: "Redeeming NYC for stSTX...",
      status: "info",
      isClosable: true,
      position: "top",
      variant: "solid",
    });
    console.log("Redeeming NYC for stSTX...");
    readyToRedeem() && stackingDaoCall();
    onClose();
  };

  const redeemForLiSTX = () => {
    toast({
      title: "Redeeming NYC for liSTX...",
      status: "info",
      isClosable: true,
      position: "top",
      variant: "solid",
    });
    console.log("Redeeming NYC for liSTX...");
    readyToRedeem() && lisaCall();
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
        {ccd012TxId === null ? (
          <>
            <Button
              isLoading={isRequestPending}
              isDisabled={ccd012TxId !== null}
              onClick={redeemNYC}
              width="full"
            >
              Redeem for STX
            </Button>
            <Button
              onClick={onOpen}
              width="full"
              isDisabled={ccd012TxId !== null}
            >
              Redeem for stSTX / liSTX
            </Button>
          </>
        ) : (
          <HStack>
            <Text>Redemption submitted!</Text>
            <Link
              isExternal
              href={`https://explorer.hiro.so/txid/${ccd012TxId}?chain=mainnet`}
            >
              View on explorer
            </Link>
            <LuExternalLink />
          </HStack>
        )}
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Redeem NYC and Stack STX</ModalHeader>
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
              have partnered to offer redemption for stSTX and liSTX.
            </Text>
            <Text mb={4}>
              Please review the resources below before proceeding to fully
              understand the process through their platform.
            </Text>
            <Text mb={4}>
              Please be aware of how each protocol operates and the associated
              risks for stSTX or liSTX before continuing.
            </Text>
            <Divider my={4} />
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="bold">Official StackingDAO Resources</Text>
              <Link href="https://www.stackingdao.com/" isExternal>
                <HStack>
                  <Text>StackingDAO Website</Text>
                  <LuExternalLink />
                </HStack>
              </Link>
              <Link href="https://discord.gg/stackingdao" isExternal>
                <HStack>
                  <Text>StackingDAO Community</Text>
                  <LuExternalLink />
                </HStack>
              </Link>
              <Text fontWeight="bold">Official LISA Resources</Text>
              <Link href="https://www.lisalab.io/" isExternal>
                <HStack>
                  <Text>LISA Website</Text>
                  <LuExternalLink />
                </HStack>
              </Link>
              <Link href="https://t.me/Lisa_community" isExternal>
                <HStack>
                  <Text>LISA Community</Text>
                  <LuExternalLink />
                </HStack>
              </Link>
            </VStack>
            <Divider mt={4} />
          </ModalBody>
          <ModalFooter flexDir="column">
            <Checkbox
              isChecked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              mb={4}
            >
              I acknowledge StackingDAO and LISA are not affiliated with
              CityCoins and that I am responsible for my own actions.
            </Checkbox>
            <Stack spacing={4} direction={["column", null, "row"]} width="full">
              <Button onClick={onClose} width="full">
                Go Back
              </Button>
              <Button
                colorScheme="green"
                onClick={redeemForStSTX}
                width="full"
                isDisabled={!consentChecked}
                isLoading={isRequestPendingStackingDAO}
              >
                Redeem stSTX
              </Button>
              <Button
                colorScheme="purple"
                onClick={redeemForLiSTX}
                width="full"
                isDisabled={!consentChecked}
                isLoading={isRequestPendingLisa}
              >
                Redeem liSTX
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

export default RedeemNYC;
