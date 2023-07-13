import {
  Button,
  Center,
  Heading,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import { UserContext } from '../../lib/userContext';
import { SlArrowLeft, SlArrowRight } from 'react-icons/sl';
import { getCookie } from 'cookies-next';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';

const Home = () => {
  const userData = useContext(UserContext);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [games, setGames] = useState([]);
  const session_key = getCookie('session_key');
  const router = useRouter();
  const { locale } = router;
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiBaseUrl}/games?session_key=${session_key}&offset=${page * 10}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setGames(data.games);
        }
        setIsLoading(false);
      });
  }, [page]);
  if (isLoading || userData === null) {
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
  return (
    <Center m={isDesktop ? '10' : '0'}>
      <VStack w='full'>
        <Heading>{content.games.title}</Heading>
        {games.length === 0 ? (
          <Text>{content.games.end}</Text>
        ) : (
          <Table
            w={isDesktop ? '50%' : 'full'}
            variant='simple'
            colorScheme='teal'>
            <Thead>
              <Tr>
                <Th>{content.games.opponent}</Th>
                <Th>{content.games.mode}</Th>
                <Th>{content.games.result}</Th>
                {isDesktop && (
                  <>
                    <Th>(M)Elo</Th>
                    <Th>{content.games.played}</Th>
                  </>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {games.map((game) => (
                <Tr
                  key={game.game_id}
                  color={game.result == 'win' ? 'millgreen.500' : game.result == 'lose' ? 'red.500' : 'teal.500'}
                  cursor='pointer'
                  onClick={() => router.push(`/games/${game.game_id}`, `/games/${game.game_id}`, { locale })}
                  _hover={{ backgroundColor: useColorModeValue('gray.100', 'millgrey.300') }}>
                  <Td>{game.enemy_name}</Td>
                  <Td>{game.game_mode}</Td>
                  <Td>{game.result}</Td>
                  {isDesktop && (
                    <>
                      <Td>{game.elo}</Td>
                      <Td>
                        {new Date(game.played_at).toDateString()} {new Date(game.played_at).getHours()}:
                        {String(new Date(game.played_at).getMinutes()).length == 1 && '0'}
                        {new Date(game.played_at).getMinutes()}
                      </Td>
                    </>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <HStack
          w={isDesktop ? '50%' : 'full'}
          justifyContent='space-between'>
          <Button
            disabled={page === 0}
            variant={'millgreen'}
            onClick={() => setPage(page - 1)}>
            <SlArrowLeft />
          </Button>
          <Text>
            {content.games.page} {page + 1}
          </Text>
          <Button
            disabled={games.length < 10}
            variant='millgreen'
            onClick={() => setPage(page + 1)}>
            <SlArrowRight />
          </Button>
        </HStack>
      </VStack>
    </Center>
  );
};

export default Home;
