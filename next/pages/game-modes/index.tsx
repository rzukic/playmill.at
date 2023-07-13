import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Heading,
  Spinner,
  useBreakpointValue,
  VStack,
  Text,
  Tooltip,
  Box,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { forwardRef, LegacyRef, useEffect, useState } from 'react';
import { FaTrophy } from 'react-icons/fa';
import apiBaseUrl from '../../lib/apiBaseURL';
import localeContent from '../../locales/locale.json';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, xl: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const [isLoading, setIsLoading] = useState(true);
  const [gameModes, setGameModes] = useState(null);
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/game_modes`)
      .then((res) => res.json())
      .then((data) => {
        setGameModes(data);
        setIsLoading(false);
      });
  }, []);
  if (isLoading) {
    return (
      <Center m='10'>
        <VStack>
          <Spinner />
        </VStack>
      </Center>
    );
  }
  return (
    <Center m='10'>
      <VStack
        spacing='10'
        w='full'
      >
        <Heading>{content['game-modes'].title}</Heading>
        {gameModes.map((gameMode) => (
          <Card
            w={isDesktop ? '20%' : isTablet ? '40%' : 'full'}
            key={gameMode.mode_id}
          >
            <CardHeader>
              <HStack>
                <Heading size='md'>{gameMode.mode_name}</Heading>
                {gameMode.counts_elo && <Trophy />}
              </HStack>
            </CardHeader>
            <CardBody>
              <Text size='sm'>{gameMode.mode_description}</Text>
            </CardBody>
            <CardFooter>
              <Text size='sm'>Playtime: {gameMode.minutes} minutes</Text>
            </CardFooter>
          </Card>
        ))}
      </VStack>
    </Center>
  );
};

export default Home;

const CustomCard = forwardRef(({ ...rest }, ref) => (
  <Box p='1'>
    <a
      ref={ref as LegacyRef<HTMLAnchorElement>}
      {...rest}
    >
      <FaTrophy />
    </a>
  </Box>
));

const Trophy = () => {
  return (
    <Tooltip
      label='This game mode counts for Elo'
      placement='right'
      color={useColorModeValue('gray.800', 'white')}
      bg={useColorModeValue('gray.100', 'millgrey.300')}
    >
      <CustomCard />
    </Tooltip>
  );
};
