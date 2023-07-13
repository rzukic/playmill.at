import {
  Avatar,
  Center,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  VStack,
  Text,
  ModalFooter,
  Button,
  useBreakpointValue,
  useToast,
  Spacer,
  Container,
} from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { io, Manager } from 'socket.io-client';
import { UserContext } from '../../../lib/userContext';
import wsBaseURL from '../../../lib/wsBaseURL';
import Flag from 'react-world-flags';
import { FaTrophy } from 'react-icons/fa';
import Board from '../../../modules/game/board';
import whitePiece from '../../../lib/resources/white.svg';
import blackPiece from '../../../lib/resources/black.svg';
import StopWatch from '../../../modules/game/stopwatch';
import GameControls from '../../../modules/game/gameControls';
import History from '../../../modules/game/history';
import useSound from 'use-sound';
import localeContent from '../../../locales/locale.json';
import apiBaseUrl from '../../../lib/apiBaseURL';
import UserBadges from '../../../modules/badges/userbadges';

const Home = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const router = useRouter();
  const userData = useContext(UserContext);
  const session_key = getCookie('session_key');
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (window.innerHeight > window.innerWidth) {
      setPortrait(true);
    }
    window.addEventListener('resize', () => {
      if (window.innerHeight > window.innerWidth) {
        setPortrait(true);
      } else {
        setPortrait(false);
      }
    });
  }, []);
  const [sock, setSocket] = useState(null);
  const [game, setGame] = useState<boolean>(false);
  const [board, setBoard] = useState(null);
  const [color, setColor] = useState(null);
  const [action, setAction] = useState(null);
  const [prevAction, setPrevAction] = useState(null);
  const [history, setHistory] = useState({ w: [], b: [] });
  const [messages, setMessages] = useState([]);
  const [playMove] = useSound('/sound/move.mp3');
  const [playOver] = useSound('/sound/gameOver.mp3');
  const [playTake] = useSound('/sound/take.mp3');
  const [userBadges, setUserBadges] = useState(null);
  useEffect(() => {
    const change = () => {
      if (sock) {
        sock.disconnect();
      }
    };
    router.events.on('routeChangeStart', change);
    return () => {
      router.events.off('routeChangeStart', change);
    };
  }, [router.events, sock]);
  useEffect(() => {
    if (userData && userData.uid && !userBadges) {
      fetch(`${apiBaseUrl}/badges?uid=${userData.uid}`)
        .then((res) => res.json())
        .then((data) => {
          let badges = [...data.badges.filter((badge) => badge.active)];
          setUserBadges(badges);
        });
    }
  }, [userData]);
  useEffect(() => {
    if (prevAction == 'take') playTake();
    else if (prevAction == 'move' && action == 'move') playTake();
    else if (action == 'move' || action == 'wait' || action == 'take') playMove();
    setPrevAction(action);
  }, [action]);
  const [time, setTime] = useState({ w: 300, b: 300 });
  const [opponentData, setOpponentData] = useState(null);
  const [endGameData, setEndGameData] = useState(null);
  const [requestedDraw, setRequestedDraw] = useState(null);
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const toast = useToast();
  useEffect(() => {
    if (typeof window !== 'undefined' && !sock && router.isReady) {
      const { game_id } = router.query;
      const gameManager = new Manager(wsBaseURL, {
        autoConnect: true,
        reconnection: false,
      });
      const gameSocket = gameManager.socket('/game', {
        auth: {
          game_id: game_id,
          session_key: session_key,
        },
      });
      setSocket(gameSocket);
      gameSocket.on('connect' as any, () => {
        setGame(true);
      });
      gameSocket.on('move' as any, (data) => {
        setBoard(JSON.parse(data));
        setAction('move');
      });
      gameSocket.on('wait' as any, (data) => {
        setBoard(JSON.parse(data));
        setAction('wait');
      });
      gameSocket.on('take' as any, (data) => {
        setBoard(JSON.parse(data));
        setAction('take');
      });
      gameSocket.on('time' as any, (data) => {
        setTime(JSON.parse(data));
      });
      gameSocket.on('history' as any, (data) => {
        setHistory(JSON.parse(data));
      });
      gameSocket.on('error' as any, (data) => {
        toast({
          description: data,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
      gameSocket.on('color' as any, (data) => {
        setColor(data);
      });
      gameSocket.on('lose' as any, (data, reason, mode_id) => {
        playOver();
        setBoard(JSON.parse(data));
        setEndGameData({
          result: {
            text: content.game.lose,
            id: 2,
          },
          mode_id,
          reason: content.game.messages.lose[reason],
        });
        onOpen();
      });
      gameSocket.on('win' as any, (data, reason, mode_id) => {
        playOver();
        setBoard(JSON.parse(data));
        setEndGameData({
          result: {
            text: content.game.win,
            id: 0,
          },
          mode_id,
          reason: content.game.messages.win[reason],
        });
        onOpen();
      });
      gameSocket.on('draw' as any, (data, reason, mode_id) => {
        playOver();
        setBoard(JSON.parse(data));
        setEndGameData({
          result: {
            text: content.game.drawn,
            id: 1,
          },
          mode_id,
          reason: content.game.messages.draw[reason],
        });
        onOpen();
      });
      gameSocket.on('draw?' as any, (data) => {
        setRequestedDraw('rec');
      });
      gameSocket.on('draw!' as any, (data) => {
        setRequestedDraw(null);
      });
      gameSocket.on('opponent' as any, (data) => {
        fetch(`${apiBaseUrl}/badges?uid=${data.uid}`)
          .then((res) => res.json())
          .then((d) => {
            let badges = [...d.badges.filter((b) => b.active)];
            setOpponentData({ ...data, badges });
          });
      });
      gameSocket.on('connectionError' as any, (data) => {
        setGame(false);
      });
      gameSocket.off;
    }
  }, [router.isReady]);
  useEffect(() => {
    if (typeof window !== 'undefined' && sock && router.isReady) {
      sock.off('message' as any);
      sock.on('message' as any, (data) => {
        setMessages([...messages, { person: 'opponent', value: data }]);
      });
    }
  }, [router.isReady, messages, sock]);
  if (userData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>Please login to play</Heading>
        </VStack>
      </Center>
    );
  }
  if (!game) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>Game not found</Heading>
        </VStack>
      </Center>
    );
  }
  if (userData === null || !sock || !color) {
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
      <Center
        m={isDesktop ? '4' : '3'}
        pt={isDesktop ? '4' : '1'}>
        <VStack>
          <HStack>
            <VStack w='full'>
              {opponentData && (
                <HStack w='full'>
                  {isDesktop && <>{color === 'w' ? <Avatar src={blackPiece.src} /> : <Avatar src={whitePiece.src} />}</>}
                  <Avatar
                    name={opponentData.username}
                    src={opponentData.image}
                  />
                  <Heading
                    size={isDesktop ? 'md' : 'sm'}
                    maxW={isDesktop ? '' : '30vw'}
                    noOfLines={2}>
                    {opponentData.username}
                  </Heading>
                  <Flag
                    code={opponentData.country_code}
                    width={isDesktop ? '50' : '30'}
                  />
                  <UserBadges badges={opponentData.badges} />
                  {opponentData.elo && <Heading size={isDesktop ? 'md' : 'sm'}>{opponentData.elo} ELO</Heading>}
                  <Spacer />
                  <StopWatch
                    time={color === 'w' ? time.b : time.w}
                    counting={endGameData ? false : action === 'wait' ? true : false}
                  />
                </HStack>
              )}
              <HStack
                w='full'
                justifyContent='center'>
                {sock && (
                  <HStack>
                    {isTablet && (
                      <History
                        history={history[color === 'w' ? 'b' : 'w']}
                        w='5.25rem'
                        h={portrait ? '60vw' : '60vh'}
                        heading={content.game.opponent}
                      />
                    )}
                    <Board
                      board={board}
                      socket={sock}
                      color={color}
                      action={action}
                    />
                    {isTablet && (
                      <History
                        history={history[color]}
                        w='5.25rem'
                        h={portrait ? '60vw' : '60vh'}
                        heading={content.game.you}
                      />
                    )}
                  </HStack>
                )}
                {!sock && <Spinner />}
              </HStack>
              <HStack w='full'>
                {isDesktop && <>{color === 'b' ? <Avatar src={blackPiece.src} /> : <Avatar src={whitePiece.src} />}</>}
                <Avatar
                  name={userData.username}
                  src={userData.image}
                />
                <Heading
                  size={isDesktop ? 'md' : 'sm'}
                  maxW={isDesktop ? '' : '30vw'}
                  noOfLines={2}>
                  {userData.username}
                </Heading>
                <Flag
                  code={userData.country_code}
                  width={isDesktop ? '50' : '30'}
                />
                <UserBadges badges={userBadges} />
                {userData.elo && <Heading size={isDesktop ? 'md' : 'sm'}>{userData.elo} ELO</Heading>}
                <Spacer />
                <StopWatch
                  time={color === 'w' ? time.w : time.b}
                  counting={endGameData ? false : action === 'move' || action === 'take' ? true : false}
                />
              </HStack>
              {!isDesktop && (
                <GameControls
                  messages={messages}
                  setMessages={setMessages}
                  socket={sock}
                  requestedDraw={requestedDraw}
                  setRequestedDraw={setRequestedDraw}
                />
              )}
            </VStack>
            {isDesktop && (
              <GameControls
                messages={messages}
                setMessages={setMessages}
                socket={sock}
                requestedDraw={requestedDraw}
                setRequestedDraw={setRequestedDraw}
              />
            )}
          </HStack>
          {!isTablet && (
            <>
              <Heading>{content.game.moves}:</Heading>
              <HStack
                w='full'
                justifyContent='center'>
                <History
                  history={history[color]}
                  w='auto'
                  heading={content.game.you}
                />
                <History
                  history={history[color === 'w' ? 'b' : 'w']}
                  w='auto'
                  heading={content.game.opponent}
                />
              </HStack>
            </>
          )}
        </VStack>
      </Center>
      {endGameData && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack
                color={endGameData.result.id == 0 ? 'yellow.500' : endGameData.result.id == 1 ? 'teal.500' : 'red.500'}
                justifyContent='center'
                w='full'>
                <Text>{endGameData.result.text}</Text>
                {endGameData.result.id == 0 && <FaTrophy />}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack w='full'>
                <Text
                  fontSize='lg'
                  fontWeight='bold'>
                  {content.game.reason}:
                </Text>
                <Text
                  fontSize='lg'
                  fontWeight='bold'>
                  {endGameData.reason}
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack
                w='full'
                justifyContent='center'>
                <Button
                  variant='millgreen'
                  onClick={() => router.push('/')}>
                  {content.navbar.home}
                </Button>
                <a href={`/play?queue=${endGameData.mode_id}`}>
                  <Button variant='millgreen'>{content.play.online.again}</Button>
                </a>
                <Button
                  variant='millgreen'
                  onClick={() => router.push(`/games/${router.query.game_id}`, `/games/${router.query.game_id}`, { locale })}>
                  {content.play.online.replay}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default Home;
