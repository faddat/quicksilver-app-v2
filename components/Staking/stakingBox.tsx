import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Text,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  Input,
  Divider,
  HStack,
  Button,
  Spacer,
  Spinner,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { useChain } from '@cosmos-kit/react';
import React, { useEffect, useState } from 'react';

import { useBalanceQuery, useQBalanceQuery, useZoneQuery } from '@/hooks/useQueries';
import { getExponent } from '@/utils';
import { shiftDigits } from '@/utils';

import StakingProcessModal from './modals/stakingProcessModal';

type StakingBoxProps = {
  selectedOption: {
    name: string;
    value: string;
    logo: string;
    chainName: string;
    chainId: string;
  };
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  setBalance: (balance: string) => void;
  setQBalance: (qBalance: string) => void;
};

export const StakingBox = ({ selectedOption, isModalOpen, setModalOpen, setBalance, setQBalance }: StakingBoxProps) => {
  const [tokenAmount, setTokenAmount] = useState<string>('0');
  const { address } = useChain(selectedOption.chainName);
  const { address: qAddress } = useChain('quicksilver');
  const exp = getExponent(selectedOption.chainName);
  const { balance, isLoading, isError } = useBalanceQuery(selectedOption.chainName, address ?? '');
  const {
    balance: qBalance,
    isLoading: qIsLoading,
    isError: qIsError,
  } = useQBalanceQuery('quicksilver', qAddress ?? '', selectedOption.value.toLowerCase());

  const qAssets = qBalance?.balance.amount || '';

  const baseBalance = shiftDigits(balance?.balance?.amount || '0', -exp);

  const { data: zone, isLoading: isZoneLoading, isError: isZoneError } = useZoneQuery(selectedOption.chainId);

  useEffect(() => {
    setQBalance(qAssets);
  }, [qAssets, setQBalance, selectedOption.chainName]);

  useEffect(() => {
    setBalance(baseBalance);
  }, [baseBalance, setBalance]);

  useEffect(() => {
    setTokenAmount('0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption.chainName]);

  const truncateToThreeDecimals = (num: number) => {
    return Math.trunc(num * 1000) / 1000;
  };

  const truncatedBalance = truncateToThreeDecimals(Number(baseBalance));

  const maxStakingAmount = truncateToThreeDecimals(truncatedBalance ? truncatedBalance - 0.005 : 0);

  const maxHalfStakingAmount = maxStakingAmount / 2;

  const [inputError, setInputError] = useState(false);

  return (
    <Box position="relative" backdropFilter="blur(50px)" bgColor="rgba(255,255,255,0.1)" flex="1" borderRadius="10px" p={5}>
      <Tabs isFitted variant="enclosed">
        <TabList mt={'4'} mb="1em" overflow="hidden" borderBottomColor="transparent" bg="rgba(255,255,255,0.1)" p={2} borderRadius="25px">
          <Tab
            borderRadius="25px"
            flex="1"
            color="white"
            fontWeight="bold"
            transition="background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out"
            _hover={{
              borderBottomColor: 'complimentary.900',
            }}
            _selected={{
              bgColor: 'rgba(0,0,0,0.5)',
              color: 'complimentary.900',
              borderColor: 'complimentary.900',
            }}
          >
            Stake
          </Tab>
          <Tab
            borderRadius="25px"
            flex="1"
            color="white"
            fontWeight="bold"
            transition="background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out"
            _hover={{
              borderBottomColor: 'complimentary.900',
            }}
            _selected={{
              bgColor: 'rgba(0,0,0,0.5)',
              color: 'complimentary.900',
              borderColor: 'complimentary.900',
            }}
          >
            Unstake
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={8} align="center">
              <Text fontWeight="light" textAlign="center" color="white">
                Stake your {selectedOption.value.toUpperCase()} tokens in exchange for q{selectedOption.value.toUpperCase()} which you can
                deploy around the ecosystem. You can liquid stake half of your balance, if you&apos;re going to LP.
              </Text>
              <Flex flexDirection="column" w="100%">
                <Stat py={4} textAlign="left" color="white">
                  <StatLabel>Amount to stake:</StatLabel>
                  <StatNumber>{selectedOption.value.toUpperCase()} </StatNumber>
                </Stat>
                <Input
                  _active={{
                    borderColor: 'complimentary.900',
                  }}
                  _selected={{
                    borderColor: 'complimentary.900',
                  }}
                  _hover={{
                    borderColor: 'complimentary.900',
                  }}
                  _focus={{
                    borderColor: 'complimentary.900',
                    boxShadow: '0 0 0 3px #FF8000',
                  }}
                  color="complimentary.900"
                  textAlign={'right'}
                  placeholder={inputError ? 'Invalid Number' : 'amount'}
                  _placeholder={{
                    color: inputError ? 'red.500' : 'grey',
                  }}
                  value={tokenAmount}
                  type="text"
                  onChange={(e) => {
                    // Allow any numeric input
                    const validNumberPattern = /^\d*\.?\d*$/;
                    if (validNumberPattern.test(e.target.value)) {
                      setTokenAmount(e.target.value);
                    }
                  }}
                  onBlur={() => {
                    // Validation on blur
                    let inputValue = parseFloat(tokenAmount);
                    if (!isNaN(inputValue)) {
                      if (inputValue < 1) {
                        setInputError(true);
                        setTokenAmount(''); // Clear the input
                      } else if (inputValue <= maxStakingAmount) {
                        setInputError(false);
                        // Optionally, adjust the input to fit within the max limit
                        setTokenAmount(Math.min(inputValue, maxStakingAmount).toString());
                      } else {
                        setInputError(true);
                        setTokenAmount(maxStakingAmount.toString()); // Set to max limit
                      }
                    } else {
                      setInputError(true);
                      setTokenAmount(''); // Clear the input for non-numeric values
                    }
                  }}
                />
                <Flex w="100%" flexDirection="row" py={4} mb={-4} justifyContent="space-between" alignItems="center">
                  <Flex mb={-4} alignItems="center" justifyContent={'center'} gap={4} flexDirection={'row'}>
                    {address ? (
                      <>
                        <Text color="white" fontWeight="light">
                          Tokens available:{' '}
                        </Text>
                        {isLoading ? (
                          <Skeleton startColor="complimentary.900" endColor="complimentary.400">
                            <SkeletonText w={'95px'} noOfLines={1} skeletonHeight={'18px'} />
                          </Skeleton>
                        ) : (
                          <Text color="complimentary.900" fontWeight="light">
                            {address
                              ? balance?.balance?.amount && Number(balance?.balance?.amount) !== 0
                                ? `${truncatedBalance} ${selectedOption.value.toUpperCase()}`
                                : `Get ${selectedOption.value.toUpperCase()} tokens here`
                              : '0'}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text color="complimentary.900" fontWeight="light">
                        Connect your wallet to stake
                      </Text>
                    )}
                  </Flex>
                  <HStack mb={-4} spacing={2}>
                    <Button
                      _hover={{
                        bgColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                      }}
                      _active={{
                        bgColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                      }}
                      color="complimentary.900"
                      variant="ghost"
                      w="60px"
                      h="30px"
                      onClick={() => setTokenAmount(maxHalfStakingAmount.toString())}
                      isDisabled={!balance || Number(balance) < 1}
                    >
                      half
                    </Button>
                    <Button
                      _hover={{
                        bgColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                      }}
                      _active={{
                        bgColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                      }}
                      color="complimentary.900"
                      variant="ghost"
                      w="60px"
                      h="30px"
                      onClick={() => setTokenAmount(maxStakingAmount.toString())}
                      isDisabled={!balance || Number(balance) < 1}
                    >
                      max
                    </Button>
                  </HStack>
                </Flex>
              </Flex>
              <Divider bgColor="complimentary.900" />
              <HStack justifyContent="space-between" alignItems="left" w="100%" mt={-8}>
                <Stat textAlign="left" color="white">
                  <StatLabel>What you&apos;ll get</StatLabel>
                  <StatNumber>q{selectedOption.value.toUpperCase()}:</StatNumber>
                </Stat>
                <Spacer /> {/* This pushes the next Stat component to the right */}
                <Stat py={4} textAlign="right" color="white">
                  <StatNumber textColor="complimentary.900">{(Number(tokenAmount) / Number(zone?.redemptionRate)).toFixed(2)}</StatNumber>
                </Stat>
              </HStack>
              <Button
                width="100%"
                _hover={{
                  bgColor: '#181818',
                }}
                _disabled={{
                  bgColor: '#181818',
                  cursor: 'not-allowed',
                }}
                onClick={() => setModalOpen(true)}
                isDisabled={Number(tokenAmount) === 0 || !address}
              >
                Liquid stake
              </Button>
              <StakingProcessModal
                tokenAmount={tokenAmount}
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                selectedOption={selectedOption}
              />
            </VStack>
          </TabPanel>
          <TabPanel>
            <VStack spacing={8} align="center">
              <Text fontWeight="light" textAlign="center" color="white">
                Unstake your q{selectedOption.value.toUpperCase()} tokens in exchange for {selectedOption.value.toUpperCase()}.
              </Text>
              <Flex flexDirection="column" w="100%">
                <Stat py={4} textAlign="left" color="white">
                  <StatLabel>Amount tounstake:</StatLabel>
                  <StatNumber>q{selectedOption.value.toUpperCase()} </StatNumber>
                </Stat>
                <Input
                  _active={{
                    borderColor: 'complimentary.900',
                  }}
                  _selected={{
                    borderColor: 'complimentary.900',
                  }}
                  _hover={{
                    borderColor: 'complimentary.900',
                  }}
                  _focus={{
                    borderColor: 'complimentary.900',
                    boxShadow: '0 0 0 3px #FF8000',
                  }}
                  color="complimentary.900"
                  textAlign={'right'}
                  placeholder="amount"
                  value={tokenAmount}
                  type="text"
                  onChange={(e) => setTokenAmount(e.target.value)}
                />
                <Flex w="100%" flexDirection="row" py={4} mb={-4} justifyContent="space-between" alignItems="center">
                  <Skeleton isLoaded={!isLoading}>
                    <SkeletonText>
                      <Text color="white" fontWeight="light">
                        Tokens available: 0 q{selectedOption.value.toUpperCase()}
                      </Text>
                    </SkeletonText>
                  </Skeleton>

                  <Button
                    _hover={{
                      bgColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                    }}
                    _active={{
                      bgColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                    }}
                    color="complimentary.900"
                    variant="ghost"
                    w="60px"
                    h="30px"
                  >
                    max
                  </Button>
                </Flex>
              </Flex>
              <Divider bgColor="complimentary.900" />
              <HStack justifyContent="space-between" alignItems="left" w="100%" mt={-8}>
                <Stat textAlign="left" color="white">
                  <StatLabel>What you&apos;ll get</StatLabel>
                  <StatNumber>{selectedOption.value.toUpperCase()}:</StatNumber>
                </Stat>
                <Spacer /> {/* This pushes the next Stat component to the right */}
                <Stat py={4} textAlign="right" color="white">
                  <StatNumber textColor="complimentary.900">{(Number(tokenAmount) * Number(zone?.redemptionRate)).toFixed(2)}</StatNumber>
                </Stat>
              </HStack>
              <Button
                width="100%"
                _hover={{
                  bgColor: 'complimentary.1000',
                }}
              >
                Liquid Stake
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
