import {
  Button,
  Divider,
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
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaWindowClose } from "react-icons/fa";
import { BiRefresh } from "react-icons/bi";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  blockHeightsAtom,
  displayStxAddressAtom,
  displayStxBalanceAtom,
  displayTokenBalancesAtom,
  fetchAccountBalancesAtom,
  fetchStacksRewardCycleAtom,
  getBlockHeights,
  stacksRewardCycleAtom,
} from "../../store/stacks";
import ClearData from "./clear-data";
import SignOut from "./sign-out";
import { useEffect } from "react";
import {
  citycoinsRewardCycleAtom,
  fetchCitycoinsRewardCycleAtom,
} from "../../store/citycoins";

function Profile() {
  const calloutColor = useColorModeValue("gray.200", "gray.900");
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [blockHeights, setBlockHeights] = useAtom(blockHeightsAtom);
  const stacksRewardCycle = useAtomValue(stacksRewardCycleAtom);
  const citycoinsRewardCycle = useAtomValue(citycoinsRewardCycleAtom);
  const fetchAccountBalances = useSetAtom(fetchAccountBalancesAtom);
  const fetchStacksRewardCycle = useSetAtom(fetchStacksRewardCycleAtom);
  const fetchCitycoinsRewardCycle = useSetAtom(fetchCitycoinsRewardCycleAtom);
  const displayStxAddress = useAtomValue(displayStxAddressAtom);
  const displayStxBalance = useAtomValue(displayStxBalanceAtom);
  const displayTokenBalances = useAtomValue(displayTokenBalancesAtom);

  // get block heights on load and then every 30 seconds
  useEffect(() => {
    async function fetchAndSetBlockHeights() {
      const newBlockHeights = await getBlockHeights();
      if (newBlockHeights) {
        if (
          !blockHeights ||
          blockHeights.stx !== newBlockHeights.stx ||
          blockHeights.btc !== newBlockHeights.btc
        ) {
          setBlockHeights(newBlockHeights);
        }
      }
    }

    fetchAndSetBlockHeights();

    const intervalId = setInterval(() => {
      fetchAndSetBlockHeights();
    }, 30000); // add a 0 for 5 minutes

    return () => clearInterval(intervalId);
  }, [blockHeights, setBlockHeights]);

  if (!displayStxAddress) {
    return null;
  }

  return (
    <>
      <Button variant="outline" title="View Profile" onClick={onOpen}>
        {displayStxAddress}
      </Button>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="md">
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
            <Stack spacing={4}>
              {/* STX Address Box */}
              <Heading
                size="lg"
                py={4}
                textAlign="center"
                border="3px solid"
                borderRadius="lg"
                borderColor={calloutColor}
                noOfLines={1}
              >
                {displayStxAddress}
              </Heading>
              {/* Block Heights */}
              <Stack direction="row">
                <Stat>
                  <StatLabel noOfLines={1}>Stacks Height</StatLabel>
                  <Skeleton isLoaded={!!blockHeights}>
                    <StatNumber noOfLines={1}>
                      {blockHeights && blockHeights.stx.toLocaleString()}
                    </StatNumber>
                  </Skeleton>
                </Stat>
                <Stat>
                  <StatLabel noOfLines={1}>Bitcoin Height</StatLabel>
                  <Skeleton isLoaded={!!blockHeights}>
                    <StatNumber noOfLines={1}>
                      {blockHeights && blockHeights.btc.toLocaleString()}
                    </StatNumber>
                  </Skeleton>
                </Stat>
              </Stack>
              <Divider />
              {/* Reward Cycles */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Heading size="lg">Reward Cycles</Heading>
                <IconButton
                  aria-label="Refresh reward cycles"
                  title="Refresh reward cycles"
                  size="sm"
                  icon={<BiRefresh />}
                  onClick={() => {
                    fetchStacksRewardCycle();
                    fetchCitycoinsRewardCycle();
                  }}
                />
              </Stack>
              <Stack direction="row">
                <Stat>
                  <StatLabel>Stacks</StatLabel>
                  <Skeleton isLoaded={!!stacksRewardCycle}>
                    <StatNumber>
                      {stacksRewardCycle && stacksRewardCycle.currentCycle}
                    </StatNumber>
                  </Skeleton>
                </Stat>
                <Stat>
                  <StatLabel>CityCoins</StatLabel>
                  <Skeleton isLoaded={!!citycoinsRewardCycle}>
                    <StatNumber>
                      {citycoinsRewardCycle &&
                        citycoinsRewardCycle.currentCycle}
                    </StatNumber>
                  </Skeleton>
                </Stat>
              </Stack>
              <Divider />
              {/* Account Balances */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Heading size="lg">Account Balances</Heading>
                <IconButton
                  aria-label="Refresh account balances"
                  title="Refresh account balances"
                  size="sm"
                  icon={<BiRefresh />}
                  onClick={() => fetchAccountBalances()}
                />
              </Stack>
              <Skeleton isLoaded={!!displayStxBalance}>
                <Stat>
                  <StatLabel>Stacks (STX)</StatLabel>
                  <StatNumber>
                    {displayStxBalance && displayStxBalance}
                  </StatNumber>
                </Stat>
              </Skeleton>
              <Skeleton isLoaded={!!displayTokenBalances}>
                {displayTokenBalances &&
                  Object.keys(displayTokenBalances)
                    .reduce<JSX.Element[][]>((acc, key, index) => {
                      const statElem = (
                        <Stat key={key}>
                          <StatLabel noOfLines={1}>{key}</StatLabel>
                          <StatNumber noOfLines={1}>
                            {displayTokenBalances[key]}
                          </StatNumber>
                        </Stat>
                      );
                      if (index % 2 === 0) {
                        acc.push([statElem]);
                      } else {
                        acc[acc.length - 1].push(statElem);
                      }
                      return acc;
                    }, [])
                    .map((pair, i) => (
                      <Stack direction="row" key={i}>
                        {pair}
                      </Stack>
                    ))}
              </Skeleton>
              <Divider />
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
