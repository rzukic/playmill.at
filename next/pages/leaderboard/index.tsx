import {
  Box,
  Center,
  Heading,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  VStack,
  Text,
  HStack,
  Avatar,
} from '@chakra-ui/react';
import { forwardRef, LegacyRef, useEffect, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import Flag from 'react-world-flags';
import { useColorModeValue } from '@chakra-ui/color-mode';
import { FaTrophy } from 'react-icons/fa';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';
import Link from 'next/link';

const Home = () => {
  // query the database for the top 100 players by (M)ELO
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const router = useRouter();
  useEffect(() => {
    fetch(`${apiBaseUrl}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setPlayers(data.leaderboard);
        }
        setIsLoading(false);
      });
  }, []);
  if (isLoading) {
    return (
      <Center m='10'>
        <Spinner />
      </Center>
    );
  }
  if (players.length === 0) {
    return (
      <Center m='10'>
        <Heading>Something went wrong</Heading>
      </Center>
    );
  }
  return (
    <Center
      m={isDesktop ? '10' : '0'}
      mt={!isDesktop && '5'}
    >
      <VStack w={isDesktop ? 'full' : 'auto'}>
        <Heading textAlign='center'>{content.leaderboard.title}</Heading>
        <Table
          w={isDesktop ? '50%' : 'full'}
          variant='simple'
          colorScheme='teal'
        >
          <Thead>
            <Tr>
              <Th>{content.leaderboard.rank}</Th>
              <Th>{content.leaderboard.user}</Th>
              {isDesktop && <Th>(M)ELO</Th>}
              <Th>{content.leaderboard.country}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player, index) => (
              <Tr key={index}>
                <Td>
                  <HStack>
                    <Text
                      fontWeight='bold'
                      color={
                        [0, 1, 2].includes(index)
                          ? index == 0
                            ? 'yellow.500'
                            : index == 1
                            ? 'gray.500'
                            : '#804a00'
                          : ''
                      }
                    >
                      {index + 1}
                    </Text>
                    {[0, 1, 2].includes(index) && (
                      <FaTrophy
                        color={
                          index == 0
                            ? '#D69E2E'
                            : index == 1
                            ? '#718096'
                            : '#804a00'
                        }
                        size='1.5em'
                      />
                    )}
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    {isDesktop && (
                      <Avatar
                        name={player.username}
                        src={player.image}
                      />
                    )}
                    <Text
                      _hover={{
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                      fontWeight='bold'
                      onClick={() => router.push(`/player/${player.uid}`)}
                    >
                      {player.username}
                    </Text>
                  </HStack>
                </Td>
                {isDesktop && <Td>{player.elo}</Td>}
                <Td>
                  <Country
                    country_code={player.country_code}
                    country_name={player.country_name}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Center>
  );
};

export default Home;

// Tooltip code
// import { Tooltip } from '@chakra-ui/react';

const CustomCard = forwardRef(
  ({ country_code, ...rest }: { country_code }, ref) => (
    <Box p='1'>
      <span
        ref={ref as LegacyRef<HTMLDivElement>}
        {...rest}
      >
        <Flag
          code={country_code}
          width='50'
        />
      </span>
    </Box>
  )
);

const Country = ({ country_code, country_name }) => {
  return (
    <Tooltip
      label={country_name}
      placement='left'
      color={useColorModeValue('gray.800', 'white')}
      bg={useColorModeValue('gray.100', 'millgrey.300')}
    >
      <CustomCard country_code={country_code} />
    </Tooltip>
  );
};
