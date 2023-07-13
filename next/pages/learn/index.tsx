import {
  Center,
  Heading,
  VStack,
  Image,
  Text,
  useBreakpointValue,
  HStack,
  Link,
  Spacer,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import board from '../../lib/resources/board.svg';
import white from '../../lib/resources/white.svg';
import black from '../../lib/resources/black.svg';
import PhaseOne from './szenarioPhaseOne.svg';
import PhaseTwo from './szenarioPhaseTwo.svg';
import LockedIn from './szenarioLocked.svg';
import Mill from './szenarioMill.svg';
import Take from './szenarioTake.svg';
import Jump from './szenarioJump.svg';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';

const Home = () => {
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const isDesktop = useBreakpointValue({ base: false, xl: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Center m='10'>
      <VStack w={isDesktop ? '40%' : isTablet ? '70%' : 'full'}>
        <Heading>{content.learn.title}</Heading>
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[0]}
        </Text>
        <Spacer />
        <Image
          src={board.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[1]}
        </Text>
        <Spacer />
        {!isMobile && (
          <VStack>
            <HStack>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((number) => (
                <HStack key={number}>
                  <Text>{number}</Text>
                  <Image
                    src={white.src}
                    alt={`white piece ${number}`}
                    width='10'
                  />
                </HStack>
              ))}
            </HStack>
            <HStack>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((number) => (
                <HStack key={number}>
                  <Text>{number}</Text>
                  <Image
                    src={black.src}
                    alt={`black piece ${number}`}
                    width='10'
                  />
                </HStack>
              ))}
            </HStack>
          </VStack>
        )}
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[2]}
        </Text>
        <Spacer />
        <Image
          src={PhaseOne.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[3]}
        </Text>
        <Spacer />
        <Image
          src={PhaseTwo.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[4]}
        </Text>
        <Spacer />
        <Image
          src={LockedIn.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[5]}
        </Text>
        <Alert
          status='info'
          borderRadius='md'
          fontSize='lg'
        >
          <AlertIcon />
          {content.learn.snippets[6]}
        </Alert>
        <Spacer />
        <Image
          src={Mill.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[7]}
        </Text>
        <Alert
          status='warning'
          borderRadius='md'
          fontSize='lg'
        >
          <AlertIcon />
          {content.learn.snippets[8]}
        </Alert>
        <Spacer />
        <Image
          src={Take.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[9]}
        </Text>
        <Alert
          status='info'
          borderRadius='md'
          fontSize='lg'
        >
          <AlertIcon />
          {content.learn.snippets[10]}
        </Alert>
        <Spacer />
        <Image
          src={Jump.src}
          w={isTablet ? '50%' : 'full'}
          borderRadius='md'
        />
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[11]}{' '}
          <Link
            href='http://www.muehlespiel.eu/images/pdf/WMD_Turnierreglement.pdf'
            color='teal.500'
            isExternal
          >
            {content.learn.links[0]}
          </Link>
        </Text>
        <Spacer />
        <Text
          align='justify'
          fontSize='lg'
          bg={useColorModeValue('gray.200', 'millgrey.300')}
          p='5'
          borderRadius='md'
        >
          {content.learn.snippets[12]}{' '}
          <Link
            href='http://www.muehlespiel.eu/images/Dokumente/muhle_uebungen.pdf'
            color='teal.500'
            isExternal
          >
            {content.learn.links[1]}
          </Link>{' '}
          {content.learn.snippets[13]}{' '}
          <Link
            href='http://www.muehlespiel.eu/'
            color='teal.500'
            isExternal
          >
            {content.learn.links[2]}
          </Link>
        </Text>
      </VStack>
    </Center>
  );
};

export default Home;
