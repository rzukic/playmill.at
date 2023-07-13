import {
  Center,
  HStack,
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
  Button,
  Container,
  Box,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import apiBaseUrl from '../../../lib/apiBaseURL';
import Board from '../../../modules/game/board';
import { getCookie } from 'cookies-next';
import { ImCheckmark, ImCross } from 'react-icons/im';
import localeContent from '../../../locales/locale.json';
import { FaTrophy } from 'react-icons/fa';

const Home = () => {
  const router = useRouter();
  const { puzzle_id } = router.query;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const { locale } = router;
  const content = localeContent.languages[locale].content;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [puzzle, setPuzzle] = useState(null);
  const [action, setAction] = useState('move');
  const [status, setStatus] = useState<Status>(null);
  const [guessCount, setGuessCount] = useState(0);
  const session_key = getCookie('session_key');
  useEffect(() => {
    if (puzzle_id === undefined) return;
    fetch(`${apiBaseUrl}/puzzle/${puzzle_id}?session_key=${session_key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'error') {
          setPuzzle(data);
        } else {
          setPuzzle(false);
        }
      });
  }, [puzzle_id]);
  const wrong = (): void => {
    setStatus(Status.wrong);
    setGuessCount(guessCount + 1);
  };
  const sock = {
    emit: (action, obj) => {
      const data = JSON.parse(obj);
      const newPuzzle = { ...puzzle };
      if (data.from == 'side') data.from = 'x';
      if (action !== puzzle.moves[0].action) return wrong();
      switch (action) {
        case 'move':
          switch (typeof puzzle.moves[0].from) {
            case 'string':
              if (data.from != puzzle.moves[0].from) return wrong();
            case 'object':
              if (!puzzle.moves[0].from.includes(data.from)) return wrong();
          }
          switch (typeof puzzle.moves[0].to) {
            case 'string':
              if (data.to != puzzle.moves[0].to) return wrong();
            case 'object':
              if (!puzzle.moves[0].to.includes(data.to)) return wrong();
          }
          if (data.from == 'x') {
            newPuzzle.board[`${puzzle.color}side`].shift();
          } else {
            newPuzzle.board[data.from] = 'x';
          }
          newPuzzle.board[data.to] = puzzle.color;
          break;
        case 'take':
          switch (typeof puzzle.moves[0].from) {
            case 'string':
              if (data.from != puzzle.moves[0].from) return wrong();
            case 'object':
              if (!puzzle.moves[0].from.includes(data.from)) return wrong();
          }
          newPuzzle.board[data.from] = 'x';
          break;
      }
      setStatus(Status.correct);
      setGuessCount(guessCount + 1);
      newPuzzle.moves.shift();
      let opponent = newPuzzle.color == 'w' ? 'b' : 'w';
      while (newPuzzle.moves[0] && newPuzzle.moves[0].color != puzzle.color) {
        switch (newPuzzle.moves[0].action) {
          case 'move':
            if (newPuzzle.moves[0].from == 'x') {
              newPuzzle.board[`${opponent}side`].shift();
            } else {
              newPuzzle.board[newPuzzle.moves[0].from] = 'x';
            }
            newPuzzle.board[newPuzzle.moves[0].to] = opponent;
            break;
          case 'take':
            newPuzzle.board[newPuzzle.moves[0].from] = 'x';
            break;
        }
        newPuzzle.moves.shift();
      }
      if (newPuzzle.moves.length == 0) {
        onOpen();
      } else {
        setAction(newPuzzle.moves[0].action);
        console.log(newPuzzle.moves[0]);
      }
      setPuzzle(newPuzzle);
    },
  };
  if (puzzle === false) {
    return (
      <Center m={isDesktop ? '10' : '4'}>
        <Text>{content.puzzle.notFound}</Text>
      </Center>
    );
  }
  if (puzzle === null) {
    return (
      <Center m={isDesktop ? '10' : '4'}>
        <Spinner />
      </Center>
    );
  }
  return (
    <VStack m={isDesktop ? '10' : '4'}>
      <HStack>
        {status == null ? (
          <ImCheckmark opacity='0' />
        ) : status != Status.wrong ? (
          <ImCheckmark style={{ color: 'green' }} />
        ) : (
          <ImCross style={{ color: 'red' }} />
        )}
        <Text>
          <strong>{guessCount}</strong> {guessCount === 1 ? content.puzzle.try : content.puzzle.tries}
        </Text>
      </HStack>
      <Board
        board={puzzle.board}
        color={puzzle.color}
        action={action}
        socket={sock}
      />
      <Modal
        isOpen={isOpen}
        onClose={null}
        isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{content.puzzle.solved}</ModalHeader>
          <ModalBody>
            <HStack justifyContent='center'>
              <Box color='yellow.500'>
                <FaTrophy />
              </Box>
              <Text>
                <strong>{guessCount}</strong> {guessCount === 1 ? content.puzzle.try : content.puzzle.tries}
              </Text>
            </HStack>
          </ModalBody>
          <ModalFooter>
            <HStack
              w='full'
              justifyContent='center'>
              <Button
                variant='millgreen'
                onClick={() => {
                  router.push('/play?tab=2');
                }}>
                {content.puzzle.all}
              </Button>
              <Button
                variant='millgreen'
                onClick={() => {
                  router.reload();
                }}>
                {content.puzzle.again}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

enum Status {
  wrong,
  correct,
}

export default Home;
