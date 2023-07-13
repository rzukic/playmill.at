import {
  Center,
  HStack,
  Heading,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
  useBreakpointValue,
  useDisclosure,
  Image,
  ModalFooter,
  Button,
  ModalBody,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { Game } from '../../../lib/game/game';
import { UserContext } from '../../../lib/userContext';
import Board from '../../../modules/game/board';
import History from '../../../modules/game/history';
import { useRouter } from 'next/router';
import localeContent from '../../../locales/locale.json';
import WhitePiece from '../../../lib/resources/white.svg';
import BlackPiece from '../../../lib/resources/black.svg';

const Home = () => {
  const router = useRouter();
  const locale = router.locale;
  const content = localeContent.languages[locale].content;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const [portrait, setPortrait] = useState(false);
  const [game, setGame] = useState<Game>(null);
  const [socket, setSocket] = useState(null);
  const [turn, setTurn] = useState('w');
  const [change, setChange] = useState(false);
  const [action, setAction] = useState('move');
  const { isOpen, onOpen, onClose } = useDisclosure();
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
    const g = new Game();
    setGame(g);
  }, []);
  useEffect(() => {
    if (game === null) return;
    const s = {
      emit(action: string, data: string) {
        const obj = JSON.parse(data);
        if (action === 'move') {
          if (game.move(turn, obj.from, obj.to)) {
            if (game.winner !== null) {
              setAction('wait');
              onOpen();
            } else if (game[`action${turn}`] === 'wait') {
              setTurn(turn === 'w' ? 'b' : 'w');
              setAction('move');
            } else {
              setAction('take');
            }
          }
        } else if (action === 'take') {
          if (game.take(turn, obj.from)) {
            if (game.winner !== null) {
              setAction('wait');
              onOpen();
            } else if (game[`action${turn}`] === 'wait') {
              setTurn(turn === 'w' ? 'b' : 'w');
              setAction('move');
            } else {
              setChange(!change);
            }
          }
        }
      },
    };
    setSocket(s);
  }, [game, turn]);
  const toast = useToast();
  if (game === null) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }
  return (
    <>
      <Center m={isDesktop ? '10' : '4'}>
        <VStack>
          <Heading>{content.play.offline.localgame}</Heading>
          <Heading
            size={isDesktop ? 'md' : 'sm'}
            fontWeight='normal'
            display='inline-flex'
            alignItems='center'
            gap='1'
            h='10'>
            <Image
              width='10'
              src={turn === 'w' ? WhitePiece.src : BlackPiece.src}
            />
            <strong>{turn === 'w' ? content.gameview.white : content.gameview.black}</strong> {content.play.offline.toplay}
          </Heading>
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
      </Center>
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
    </>
  );
};

export default Home;
