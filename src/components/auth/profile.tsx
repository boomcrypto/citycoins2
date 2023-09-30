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
  useDisclosure,
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaWindowClose } from "react-icons/fa";
import { BiRefresh } from "react-icons/bi";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  blockHeightsAtom,
  displayProfileNameAtom,
  displayStxAddressAtom,
  displayStxBalanceAtom,
  displayStxLockedAtom,
  fetchAccountBalancesAtom,
  fetchBlockHeightsAtom,
  fetchStacksRewardCycleAtom,
  getBlockHeights,
  stacksRewardCycleAtom,
} from "../../store/stacks";
import ClearData from "./clear-data";
import SignOut from "./sign-out";
import { useEffect, useRef } from "react";
import {
  citycoinsRewardCycleAtom,
  citycoinsUserIdsAtom,
  displayCitycoinBalancesAtom,
  fetchCitycoinsRewardCycleAtom,
  fetchCitycoinsUserIdsAtom,
} from "../../store/citycoins";
import { triggerSpin } from "../../store/common";
import { useCalloutColor } from "../../hooks/use-callout-color";

function Profile() {
  const calloutColor = useCalloutColor();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [blockHeights, setBlockHeights] = useAtom(blockHeightsAtom);
  const stacksRewardCycle = useAtomValue(stacksRewardCycleAtom);
  const citycoinsRewardCycle = useAtomValue(citycoinsRewardCycleAtom);
  const citycoinsUserIds = useAtomValue(citycoinsUserIdsAtom);

  const fetchBlockHeights = useSetAtom(fetchBlockHeightsAtom);
  const fetchAccountBalances = useSetAtom(fetchAccountBalancesAtom);
  const fetchStacksRewardCycle = useSetAtom(fetchStacksRewardCycleAtom);
  const fetchCitycoinsRewardCycle = useSetAtom(fetchCitycoinsRewardCycleAtom);
  const fetchCitycoinsUserIds = useSetAtom(fetchCitycoinsUserIdsAtom);

  const displayProfileName = useAtomValue(displayProfileNameAtom);
  const displayStxAddress = useAtomValue(displayStxAddressAtom);
  const displayStxBalance = useAtomValue(displayStxBalanceAtom);
  const displayStxLocked = useAtomValue(displayStxLockedAtom);
  const displayCitycoinBalances = useAtomValue(displayCitycoinBalancesAtom);

  const refreshBlockHeights = useRef(null);
  const refreshRewardCycles = useRef(null);
  const refreshAccountBalances = useRef(null);
  const refreshUserIds = useRef(null);

  // get block heights on load and then every 5 minutes
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
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [blockHeights, setBlockHeights]);

  if (!displayStxAddress) {
    return null;
  }

  return (
    <>
      <Button variant="outline" title="View Profile" onClick={onOpen}>
        {displayProfileName}
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
                size={["md", "lg"]}
                py={4}
                textAlign="center"
                border="3px solid"
                borderRadius="lg"
                borderColor={calloutColor}
              >
                {displayProfileName}
              </Heading>
              {/* Block Heights */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Heading size={["md", "lg"]}>Block Heights</Heading>
                <IconButton
                  aria-label="Refresh block heights"
                  title="Refresh block heights"
                  size="sm"
                  icon={<BiRefresh />}
                  ref={refreshBlockHeights}
                  onClick={() => {
                    triggerSpin(refreshBlockHeights);
                    fetchBlockHeights();
                  }}
                />
              </Stack>
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
                <Heading size={["md", "lg"]}>Reward Cycles</Heading>
                <IconButton
                  aria-label="Refresh reward cycles"
                  title="Refresh reward cycles"
                  size="sm"
                  icon={<BiRefresh />}
                  ref={refreshRewardCycles}
                  onClick={() => {
                    triggerSpin(refreshRewardCycles);
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
                <Heading size={["md", "lg"]}>Account Balances</Heading>
                <IconButton
                  aria-label="Refresh account balances"
                  title="Refresh account balances"
                  size="sm"
                  icon={<BiRefresh />}
                  ref={refreshAccountBalances}
                  onClick={() => {
                    triggerSpin(refreshAccountBalances);
                    fetchAccountBalances();
                  }}
                />
              </Stack>
              <Stack direction="row">
                <Stat>
                  <StatLabel>stx (available)</StatLabel>
                  <Skeleton isLoaded={!!displayStxBalance}>
                    <StatNumber>
                      {displayStxBalance && displayStxBalance}
                    </StatNumber>
                  </Skeleton>
                </Stat>
                <Stat>
                  <StatLabel>stx (locked)</StatLabel>
                  <Skeleton isLoaded={!!displayStxLocked}>
                    <StatNumber>
                      {displayStxLocked && displayStxLocked}
                    </StatNumber>
                  </Skeleton>
                </Stat>
              </Stack>
              <Skeleton isLoaded={!!displayCitycoinBalances}>
                {displayCitycoinBalances &&
                  Object.keys(displayCitycoinBalances)
                    .reduce<JSX.Element[][]>((acc, key, index) => {
                      const statElem = (
                        <Stat key={key}>
                          <StatLabel noOfLines={1}>{key}</StatLabel>
                          <StatNumber noOfLines={1}>
                            {displayCitycoinBalances[key]}
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
              {/* User IDs */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Heading size={["md", "lg"]}>User IDs</Heading>
                <IconButton
                  aria-label="Refresh user IDs"
                  title="Refresh user IDs"
                  size="sm"
                  icon={<BiRefresh />}
                  ref={refreshUserIds}
                  onClick={() => {
                    fetchCitycoinsUserIds();
                  }}
                />
              </Stack>
              <Skeleton isLoaded={!!citycoinsUserIds}>
                {citycoinsUserIds &&
                  Object.entries(citycoinsUserIds)
                    .reduce<JSX.Element[][]>((acc, [key, value]) => {
                      let elements: JSX.Element[] = [];

                      if (value && typeof value === "object") {
                        elements = Object.entries(value).map(
                          ([nestedKey, nestedValue]) => {
                            return (
                              <Stat key={`${key}-${nestedKey}`}>
                                <StatLabel>{`${key} ${nestedKey}`}</StatLabel>
                                <StatNumber>
                                  {nestedValue !== null ? nestedValue : "none"}
                                </StatNumber>
                              </Stat>
                            );
                          }
                        );
                      } else {
                        elements.push(
                          <Stat key={key}>
                            <StatLabel>{key}</StatLabel>
                            <StatNumber>
                              {value !== null ? value : "none"}
                            </StatNumber>
                          </Stat>
                        );
                      }

                      elements.forEach((elem) => {
                        if (
                          acc.length === 0 ||
                          acc[acc.length - 1].length === 2
                        ) {
                          acc.push([elem]);
                        } else {
                          acc[acc.length - 1].push(elem);
                        }
                      });

                      return acc;
                    }, [])
                    .map((pair, i) => (
                      <Stack direction="row" key={i}>
                        {pair}
                      </Stack>
                    ))}
              </Skeleton>
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
