import { useRouter } from 'next/router';
import { CpuGame } from '../../../lib/game/cpuGame';
import localeContent from '../../../locales/locale.json';
import { useEffect, useState } from 'react';
import {
  Button,
  Center,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
  useBreakpointValue,
  useDisclosure,
  Text,
  Image,
  useToast,
} from '@chakra-ui/react';
import History from '../../../modules/game/history';
import Board from '../../../modules/game/board';
import BlackPiece from '../../../lib/resources/black.svg';
import WhitePiece from '../../../lib/resources/white.svg';

const Home = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const locale = router.locale;
  const content = localeContent.languages[locale].content;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const [portrait, setPortrait] = useState(false);
  const [game, setGame] = useState<CpuGame>(null);
  const [socket, setSocket] = useState(null);
  const [turn, setTurn] = useState('w');
  const [change, setChange] = useState(false);
  const [action, setAction] = useState('move');
  const SetAction = (a: string) => {
    setAction(a);
    setChange(!change);
  };
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
  useEffect(() => {
    const cpuGameObject = new CpuGame();
    setGame(cpuGameObject);
  }, []);

  useEffect(() => {
    if (game === null || typeof window === 'undefined') return;
    const s = {
      emit(action: string, data: string) {
        const obj = JSON.parse(data);
        if (action === 'move') {
          game.makeMove(turn, obj.from, obj.to).then((response) => {
            if (response) {
              if (game.winner !== null) {
                SetAction('wait');
                onOpen();
              } else if (game[`action${turn}`] === 'take2') {
                SetAction('take');
              } else {
                SetAction(game[`action${turn}`]);
              }
            }
          });
        } else if (action === 'take') {
          game.makeMove(turn, obj.from, null).then((response) => {
            if (response) {
              if (game.winner !== null) {
                SetAction('wait');
                onOpen();
              } else if (game[`action${turn}`] === 'take2') {
                SetAction('take');
              } else {
                SetAction(game[`action${turn}`]);
              }
            }
          });
        }
      },
    };
    setSocket(s);
  }, [game, change]);
  const toast = useToast();
  if (game === null) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }
  return (
    <Center m={isDesktop ? '10' : '4'}>
      <VStack>
        <Heading>{content.play.offline.botgame}</Heading>
        <HStack
          w='full'
          justifyContent='center'>
          {isTablet && (
            <History
              history={game?.historyw}
              w='5.25rem'
              h={portrait ? '60vw' : '60vh'}
              heading={content.gameview.white}
            />
          )}
          <Board
            board={game?.board}
            color={turn}
            socket={socket}
            action={action}
          />
          {isTablet && (
            <History
              history={game?.historyb}
              w='5.25rem'
              h={portrait ? '60vw' : '60vh'}
              heading={content.gameview.black}
            />
          )}
        </HStack>
        {!isTablet && (
          <HStack
            w='full'
            justifyContent='center'
            alignItems='flex-start'>
            <History
              history={game?.historyw}
              w='auto'
              heading={content.gameview.white}
            />
            <History
              history={game?.historyb}
              w='auto'
              heading={content.gameview.black}
            />
          </HStack>
        )}
      </VStack>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading textAlign='center'>
              {game.winner === 'x' ? (
                <>{content.game.drawn}</>
              ) : (
                <>
                  {game.winner === 'w' ? content.gameview.white : content.gameview.black} {content.play.offline.wins}
                </>
              )}
            </Heading>
          </ModalHeader>
          <ModalBody
            display='flex'
            justifyContent='center'
            alignItems='center'
            gap='2'
            w='full'>
            {game.winner !== 'x' && (
              <Image
                width={20}
                src={game.winner === 'w' ? WhitePiece.src : BlackPiece.src}
              />
            )}
            <Text>
              {game.winner === 'w' ? game.historyw.length : game.historyb.length} {content.play.offline.moves}
            </Text>
          </ModalBody>
          <ModalFooter>
            <HStack
              width='full'
              justifyContent='center'>
              <Button
                variant='millgreen'
                onClick={() => router.push('/')}>
                Home
              </Button>
              <Button
                variant='millgreen'
                onClick={onClose}>
                Ok
              </Button>
              <Button
                variant='millgreen'
                onClick={() => router.reload()}>
                {content.play.offline.playagain}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
};

export default Home;
