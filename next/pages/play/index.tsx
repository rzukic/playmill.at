import {
  Center,
  Flex,
  Heading,
  Spinner,
  Square,
  VStack,
  Text,
  FormControl,
  useBreakpointValue,
  Button,
  HStack,
  Link,
  useToast,
  Container,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../lib/userContext';
import { chakraComponents, GroupBase, OptionProps, Select } from 'chakra-react-select';
import { useColorModeValue } from '@chakra-ui/react';
import { ImTrophy } from 'react-icons/im';
import apiBaseUrl from '../../lib/apiBaseURL';
import { io, Manager, Socket } from 'socket.io-client';
import { getCookie } from 'cookies-next';
import Router, { useRouter } from 'next/router';
import wsBaseURL from '../../lib/wsBaseURL';
import localeContent from '../../locales/locale.json';
import { BsCpuFill, BsFillPersonFill } from 'react-icons/bs';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, xl: true });
  const isTablet = useBreakpointValue({ base: false, md: true });
  const userData = useContext(UserContext);
  const router = useRouter();
  const { locale } = router;
  const { tab } = router.query;
  const content = localeContent.languages[locale].content;
  const [selectedTab, setSelectedTab] = useState(0);
  useEffect(() => {
    if (!tab || parseInt(tab as string) < 0 || parseInt(tab as string) > 2) return;
    setSelectedTab(parseInt(tab as string));
  }, [tab]);
  if (userData === null) {
    return (
      <Center m='10'>
        <VStack>
          <Spinner />
        </VStack>
      </Center>
    );
  }
  return (
    <>
      <Tabs
        isFitted
        onChange={(val) => setSelectedTab(val)}
        index={userData === false ? 1 : selectedTab}>
        <TabList>
          <Tab
            pt='4'
            _selected={{
              color: 'millgreen.500',
              borderBottom: '2px solid',
            }}
            isDisabled={userData === false}
            css={
              userData === false && {
                '&:hover:after': {
                  content: `"${content.play.online.plslogin}"`,
                },
                '&:hover > span': {
                  display: 'none',
                },
              }
            }>
            <span>{content.play.online.title}</span>
          </Tab>
          <Tab
            pt='4'
            _selected={{
              color: 'millgreen.500',
              borderBottom: '2px solid',
            }}>
            {content.play.offline.title}
          </Tab>
          <Tab
            pt='4'
            _selected={{
              color: 'millgreen.500',
              borderBottom: '2px solid',
            }}
            isDisabled={userData === false}
            css={
              userData === false && {
                '&:hover:after': {
                  content: `"${content.play.online.plslogin}"`,
                },
                '&:hover > span': {
                  display: 'none',
                },
              }
            }>
            <span>{content.play.puzzles.title}</span>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p='0'>
            <Online
              content={content}
              tab={selectedTab}
            />
          </TabPanel>
          <TabPanel p='10'>
            <VStack w='full'>
              <Heading>{content.play.offline.title}</Heading>
              <Container
                gap='0'
                display='flex'
                w='full'
                justifyContent='center'>
                <VStack
                  alignItems='flex-end'
                  gap='5'>
                  <Button
                    h='32'
                    w='32'
                    variant='millgreen'
                    borderRightRadius={0}
                    borderWidth='2px'
                    borderColor='millgreen.400'
                    borderRightWidth='1px'
                    onClick={() => router.push('/offline/bot', '/offline/bot', { locale })}>
                    <BsCpuFill size='100%' />
                  </Button>
                  <Text
                    pr='2'
                    borderRightWidth='2px'
                    borderColor='millgreen.600'
                    textAlign='center'>
                    {content.play.offline.ai}
                  </Text>
                </VStack>
                <VStack
                  alignItems='flex-star'
                  gap='5'>
                  <Button
                    h='32'
                    w='32'
                    variant='millgreen'
                    borderLeftRadius={0}
                    borderWidth='2px'
                    borderColor='millgreen.400'
                    borderLeftWidth='1px'
                    onClick={() => router.push('/offline/local', '/offline/local', { locale })}>
                    <BsFillPersonFill size='100%' />
                  </Button>
                  <Text
                    pl='2'
                    borderLeftWidth='2px'
                    borderColor='millgreen.600'
                    textAlign='center'>
                    {content.play.offline.person}
                  </Text>
                </VStack>
              </Container>
            </VStack>
          </TabPanel>
          <TabPanel p='10'>
            <Puzzles />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

export default Home;

const Puzzles = ({}) => {
  const [packs, setPacks] = useState<Array<any>>(null);
  useEffect(() => {
    fetch(`${apiBaseUrl}/puzzle_packs`)
      .then((res) => res.json())
      .then((data) => {
        setPacks(data);
      });
  }, []);
  const userData = useContext(UserContext);
  const router = useRouter();
  return (
    <VStack w='full'>
      <Heading>Puzzles</Heading>
      <Heading>Free Packs</Heading>
      {packs
        ?.filter((pack) => !pack.premium)
        .map((pack) => {
          return (
            <VStack key={pack.pack_id}>
              <Heading size='lg'>{pack.pack_name}</Heading>
              <Flex gap='2'>
                {pack.puzzles.map((puzzle) => {
                  return (
                    <Button
                      key={puzzle.puzzle_id}
                      variant='millgreen'
                      onClick={() => router.push(`/puzzle/${puzzle.puzzle_id}`)}>
                      {puzzle.puzzle_id}
                    </Button>
                  );
                })}
              </Flex>
            </VStack>
          );
        })}
      {userData.premium && <Heading>Premium Packs</Heading>}
      {userData.premium &&
        packs
          ?.filter((pack) => pack.premium)
          .map((pack) => {
            return (
              <VStack key={pack.pack_id}>
                <Heading size='lg'>{pack.pack_name}</Heading>
                <Flex gap='2'>
                  {pack.puzzles.map((puzzle) => {
                    return (
                      <Button
                        key={puzzle.puzzle_id}
                        variant='millgreen'
                        onClick={() => router.push(`/puzzle/${puzzle.puzzle_id}`)}>
                        {puzzle.puzzle_id}
                      </Button>
                    );
                  })}
                </Flex>
              </VStack>
            );
          })}
    </VStack>
  );
};

const Online = ({ content, tab }) => {
  const isDesktop = useBreakpointValue({ base: false, xl: true });
  const isTablet = useBreakpointValue({ base: false, md: true });
  const userData = useContext(UserContext);
  const router = useRouter();
  const locale = router.locale;
  const [selectedGameMode, setSelectedGameMode] = useState<GameModeOption>(null);
  const [socket, setSocket] = useState<Socket>(null);
  const [gameModes, setGameModes] = useState<GameModeOption[]>(null);
  const toast = useToast();
  const [isQueueing, setIsQueueing] = useState(false);
  useEffect(() => {
    if (tab !== 0) {
      if (socket) {
        socket.disconnect();
      }
      if (isQueueing) {
        setIsQueueing(false);
      }
    }
  }, [tab]);
  useEffect(() => {
    const change = () => {
      if (socket) {
        socket.disconnect();
      }
      if (isQueueing) {
        setIsQueueing(false);
      }
    };
    router.events.on('routeChangeStart', () => change);
    return () => {
      router.events.off('routeChangeStart', () => change);
    };
  }, [router.events, socket, isQueueing]);
  useEffect(() => {
    fetch(`${apiBaseUrl}/game_modes`)
      .then((res) => res.json())
      .then((data) => {
        setGameModes(
          data.map((gameMode) => ({
            value: gameMode.mode_id,
            label: gameMode.mode_name,
            minutes: gameMode.minutes,
            counts_elo: gameMode.counts_elo,
          })) as GameModeOption[]
        );
      });
  }, []);
  const handleQueue = (mode_id) => {
    if (typeof window === 'undefined') return;
    const queueManager = new Manager(wsBaseURL, {
      autoConnect: true,
      reconnection: false,
    });
    const queueSocket = queueManager.socket('/queue', {
      auth: {
        session_key: getCookie('session_key'),
        mode_id: mode_id,
      },
    });
    setSocket(queueSocket);
    queueSocket.on('gameFound' as any, (data) => {
      setIsQueueing(false);
      router.push(`/game/${data}`, `/game/${data}`, { locale });
    });
    queueSocket.on('waiting' as any, () => {
      setIsQueueing(true);
    });
    queueSocket.on('error' as any, (data) => {
      toast({
        title: 'Error',
        description: data,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });
    queueSocket.on('disconnect' as any, (data) => {
      setIsQueueing(false);
    });
  };
  useEffect(() => {
    if (router.query.queue && gameModes) {
      const mode_id = parseInt(router.query.queue as string);
      const mode = gameModes.find((gameMode) => parseInt(gameMode.value as string) === mode_id);
      if (mode) {
        setSelectedGameMode(mode);
        handleQueue(mode_id);
      }
    }
  }, [gameModes]);
  return (
    <Center m='10'>
      <VStack w={isDesktop ? '30%' : isTablet ? '50%' : 'full'}>
        <Heading>{content.play.online.play}</Heading>
        {userData.elo && (
          <HStack>
            <Text fontSize='md'>{content.play.online.currelo}</Text>
            <Text
              fontSize='md'
              color='millgreen.500'
              fontWeight='bold'>
              {userData.elo}
            </Text>
          </HStack>
        )}
        <Text>{content.play.online.info}</Text>
        <Text>
          {content.play.online.modeinfo}{' '}
          <Link
            color='millgreen.500'
            href={`/${locale}/game-modes`}>
            {content.play.online.modes}
          </Link>
        </Text>
        <FormControl>
          <Select
            placeholder={content.play.online.selmode}
            options={gameModes}
            components={customComponents}
            variant='filled'
            value={selectedGameMode}
            onChange={(value) => setSelectedGameMode(value as unknown as GameModeOption)}
            chakraStyles={{
              dropdownIndicator: (provided) => ({
                ...provided,
                bg: 'transparent',
              }),
              control: (provided) => ({
                ...provided,
                _focus: {
                  borderColor: 'millgreen.500',
                },
              }),
              menuList: (provided) => ({
                ...provided,
                bg: useColorModeValue('white', 'millgrey.300'),
              }),
              option: (provided) => ({
                ...provided,
                bg: useColorModeValue('white', 'millgrey.300'),
                _hover: {
                  bg: useColorModeValue('millgreen.100', 'millgreen.500'),
                },
                color: useColorModeValue('black', 'white'),
              }),
            }}
            isDisabled={isQueueing}
          />
        </FormControl>
        {isQueueing ? (
          <Button
            data-umami-event='Cancel queue'
            variant='millgreen'
            bgColor='red.500'
            _hover={{ bgColor: 'red.600' }}
            w='full'
            onClick={() => {
              if (typeof window === 'undefined' || !socket) return;
              socket.disconnect();
              setIsQueueing(false);
            }}>
            {content.game.drawcancel}
          </Button>
        ) : (
          <Button
            data-umami-event='Start queue'
            w='full'
            variant='millgreen'
            isDisabled={!selectedGameMode || isQueueing}
            onClick={() => handleQueue(selectedGameMode.value)}>
            {content.play.online.queue}
          </Button>
        )}
        {isQueueing && (
          <HStack>
            <Spinner />
            <Text>{content.play.online.waiting}</Text>
          </HStack>
        )}
      </VStack>
    </Center>
  );
};

const customComponents = {
  Option: ({ children, ...props }: OptionProps<GameModeOption, true, GroupBase<GameModeOption>>) => {
    const { locale } = useRouter();
    const content = localeContent.languages[locale].content;
    return (
      <chakraComponents.Option {...props}>
        <Flex
          gap='2'
          justifyContent='space-between'
          w='full'>
          <Text>
            {props.data.label} {props.data.counts_elo && '(' + content.play.online.countselo + ')'}
          </Text>
          <Text>{props.data.minutes} minutes</Text>
        </Flex>
      </chakraComponents.Option>
    );
  },
};

interface GameModeOption {
  value: string;
  label: string;
  minutes: number;
  counts_elo: boolean;
}
