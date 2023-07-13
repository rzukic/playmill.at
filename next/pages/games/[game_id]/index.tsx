import { Center, Heading, Spinner, useBreakpointValue, VStack, Text, HStack, Link, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { use, useContext, useEffect, useState } from 'react';
import apiBaseUrl from '../../../lib/apiBaseURL';
import { UserContext } from '../../../lib/userContext';
import Board from '../../../modules/game/board';
import History from '../../../modules/game/history';
import { SlArrowLeft, SlArrowRight } from 'react-icons/sl';
import { getActiveElement } from 'formik';
import localeContent from '../../../locales/locale.json';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const isBig = useBreakpointValue({ base: false, lg: true });
  const router = useRouter();
  const { locale } = router;
  const content = localeContent.languages[locale].content;
  const { game_id } = router.query;
  const userData = useContext(UserContext);
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
  const [moveNumber, setMoveNumber] = useState(null);
  const [prevMoveNumber, setPrevMoveNumber] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [board, setBoard] = useState({
    a1: 'x',
    a4: 'x',
    a7: 'x',
    d7: 'x',
    g7: 'x',
    g4: 'x',
    g1: 'x',
    d1: 'x',
    d2: 'x',
    b2: 'x',
    b4: 'x',
    b6: 'x',
    d6: 'x',
    f6: 'x',
    f4: 'x',
    f2: 'x',
    d3: 'x',
    c3: 'x',
    c4: 'x',
    c5: 'x',
    d5: 'x',
    e5: 'x',
    e4: 'x',
    e3: 'x',
    wside: ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
    bside: ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'],
  });
  useEffect(() => {
    if (game_id === undefined) return;
    fetch(`${apiBaseUrl}/game_notation?gid=${game_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          if (data.game.notation) {
            data.game.notation = JSON.parse(data.game.notation);
            data.game.history = buildHistory(data.game.notation.w.reverse(), data.game.notation.b.reverse());
            setMoveNumber(data.game.history.length - 1);
          }
          setGameData(data.game);
        } else setGameData(false);
      });
  }, [game_id]);

  useEffect(() => {
    if (moveNumber === null) return;
    const newBoard = { ...board };
    if ((prevMoveNumber || prevMoveNumber === 0) && moveNumber > prevMoveNumber) {
      switch (gameData.history[prevMoveNumber].action) {
        case 'move':
          if (gameData.history[prevMoveNumber].from === 'x') {
            newBoard[gameData.history[prevMoveNumber].to] = 'x';
            newBoard[`${gameData.history[prevMoveNumber].color}side`].push(gameData.history[prevMoveNumber].color);
          } else {
            newBoard[gameData.history[prevMoveNumber].from] = gameData.history[prevMoveNumber].color;
            newBoard[gameData.history[prevMoveNumber].to] = 'x';
          }
          break;
        case 'take':
          newBoard[gameData.history[prevMoveNumber].from] = gameData.history[prevMoveNumber].color == 'w' ? 'b' : 'w';
          newBoard[`${gameData.history[prevMoveNumber].color}side`].splice(
            newBoard[`${gameData.history[prevMoveNumber].color}side`].findIndex(
              (e) => e === (gameData.history[prevMoveNumber].color == 'w' ? 'b' : 'w')
            ),
            1
          );
          break;
      }
    } else {
      switch (gameData.history[moveNumber].action) {
        case 'move':
          if (gameData.history[moveNumber].from === 'x') {
            newBoard[`${gameData.history[moveNumber].color}side`].splice(
              newBoard[`${gameData.history[moveNumber].color}side`].findIndex((e) => e === gameData.history[moveNumber].color),
              1
            );
            newBoard[gameData.history[moveNumber].to] = gameData.history[moveNumber].color;
          } else {
            newBoard[gameData.history[moveNumber].to] = gameData.history[moveNumber].color;
            newBoard[gameData.history[moveNumber].from] = 'x';
          }
          break;
        case 'take':
          newBoard[gameData.history[moveNumber].from] = 'x';
          newBoard[`${gameData.history[moveNumber].color}side`].push(gameData.history[moveNumber].color == 'w' ? 'b' : 'w');
          break;
      }
    }
    setBoard(newBoard);
    setPrevMoveNumber(moveNumber);
  }, [moveNumber]);

  if (userData === null || gameData === null) {
    return (
      <Center m='10'>
        <Spinner />
      </Center>
    );
  }
  if (userData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='md'>Please login to view your games</Heading>
        </VStack>
      </Center>
    );
  }
  if (gameData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='md'>Game not found</Heading>
        </VStack>
      </Center>
    );
  }
  return (
    <Center m={isDesktop ? '10' : '4'}>
      <VStack w='full'>
        <Heading>
          {content.gameview.game} {game_id}
        </Heading>
        <Text>Played: {new Date(gameData.played_at).toLocaleDateString('de-DE')}</Text>
        <HStack>
          <Text>
            <Link
              color='teal'
              href={`/player/${gameData.wuid}`}>
              {gameData.wusername}
            </Link>{' '}
            {content.gameview.as} {content.gameview.white}
          </Text>
          <Text fontWeight='bold'>{content.gameview.vs}</Text>
          <Text>
            <Link
              color='teal'
              href={`/player/${gameData.wuid}`}>
              {gameData.busername}
            </Link>{' '}
            {content.gameview.as} {content.gameview.black}
          </Text>
        </HStack>
        <Text>
          {content.gameview.winner}:{' '}
          <Link
            color='teal'
            href={`/player/${gameData.winner === 'w' ? gameData.wuid : gameData.buid}`}>
            {gameData.winner === 'w' ? gameData.wusername : gameData.busername}
          </Link>{' '}
        </Text>
        {!gameData.notation && <Text>{content.gameview.nonotation}</Text>}
        {gameData.notation && (
          <>
            <HStack>
              {isBig && (
                <History
                  heading={content.gameview.white}
                  history={gameData.notation.w}
                  w='auto'
                  h={portrait ? '80vw' : '60vh'}
                />
              )}
              <Board
                board={board}
                action={'wait'}
                color={'w'}
                socket={null}
              />
              {isBig && (
                <History
                  heading={content.gameview.black}
                  history={gameData.notation.b}
                  w='auto'
                  h={portrait ? '80vw' : '60vh'}
                />
              )}
            </HStack>
            <Text>{content.gameview.controls}:</Text>
            <HStack alignItems='flex-start'>
              <Button
                variant='millgreen'
                disabled={moveNumber === gameData.history.length - 1}
                onClick={() => {
                  setMoveNumber(moveNumber + 1);
                }}>
                <SlArrowLeft />
              </Button>
              <Button
                variant='millgreen'
                disabled={moveNumber === 0}
                onClick={() => {
                  setMoveNumber(moveNumber - 1);
                }}>
                <SlArrowRight />
              </Button>
            </HStack>
            <HStack alignItems='flex-start'>
              {!isBig && (
                <>
                  <History
                    heading={content.gameview.white}
                    history={gameData.notation.w}
                    w='auto'
                  />
                  <History
                    heading={content.gameview.black}
                    history={gameData.notation.b}
                    w='auto'
                  />
                </>
              )}
            </HStack>
          </>
        )}
      </VStack>
    </Center>
  );
};

export default Home;

function buildHistory(w, b) {
  let history = [];
  let wi = 0;
  let bi = 0;
  while (wi < w.length || bi < b.length) {
    if (wi < w.length) {
      let wmove;
      do {
        wmove = w[wi];
        history.push({
          ...wmove,
          color: 'w',
        });
        wi++;
      } while (wi < w.length && w[wi].action == 'take');
    }
    if (bi < b.length) {
      let bmove;
      do {
        bmove = b[bi];
        history.push({
          ...bmove,
          color: 'b',
        });
        bi++;
      } while (bi < b.length && b[bi].action == 'take');
    }
  }
  history.reverse();
  history.push({ action: 'start' });
  return history;
}
