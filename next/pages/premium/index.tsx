import {
  Center,
  Heading,
  VStack,
  useBreakpointValue,
  Text,
  Button,
  Spinner,
  Container,
  List,
  ListItem,
  Link,
  ListIcon,
  HStack,
  Image,
  color,
} from '@chakra-ui/react';
import apiBaseUrl from '../../lib/apiBaseURL';
import { getCookie } from 'cookies-next';
import { useContext } from 'react';
import { UserContext } from '../../lib/userContext';
import { useRouter } from 'next/router';
import localeContent from '../../locales/locale.json';
import { BsFillBookmarkCheckFill, BsFillBookmarkXFill, BsFillPatchCheckFill } from 'react-icons/bs';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const session_key = getCookie('session_key');
  const userData = useContext(UserContext);
  const router = useRouter();
  const content = localeContent.languages[router.locale].content;
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
    <Center m={isDesktop ? '10' : '4'}>
      <VStack
        w='full'
        maxW='30rem'
        gap='5'>
        <Heading>{content.premium.title}</Heading>
        <Text
          textAlign='justify'
          fontSize='lg'>
          {content.premium.description}
        </Text>

        <Heading size='lg'>{content.premium.benefits.title}</Heading>
        <List fontSize='lg'>
          {content.premium.benefits.withPremium.map((item, index) => (
            <ListItem>
              <ListIcon
                as={BsFillBookmarkCheckFill}
                fill='yellow.500'
              />
              {item}
            </ListItem>
          ))}
        </List>
        <HStack>
          <Heading size='md'>Premium {content.badges.headers.badge}: </Heading>
          <Text
            padding='1'
            borderRadius='md'
            size={isDesktop ? 'md' : 'xs'}
            textColor={'teal.900'}
            backgroundColor={'yellow.500'}
            borderColor={'transparent'}
            borderWidth='1px'>
            <BsFillPatchCheckFill />
          </Text>
        </HStack>
        <Heading size='lg'>{content.premium.benefits.titlewo}</Heading>
        <List fontSize='lg'>
          {content.premium.benefits.withOutPremium.map((item, index) => (
            <ListItem>
              <ListIcon
                as={BsFillBookmarkXFill}
                fill='red.500'
              />
              {item}
            </ListItem>
          ))}
        </List>
        <Text>
          Get all of this for only <strong style={{ color: '#71a343' }}>2.99€</strong> a month!
        </Text>
        {userData.premium && (
          <Button
            color={userData.premium ? 'red.500' : 'yellow.500'}
            borderColor={userData.premium ? 'red.500' : 'yellow.500'}
            border='1px'
            _hover={
              userData.premium
                ? {
                    bg: 'red.500',
                    borderColor: 'red.500',
                    color: 'white',
                  }
                : {
                    bg: 'yellow.500',
                    borderColor: 'yellow.500',
                    color: 'white',
                  }
            }
            _active={
              userData.premium
                ? {
                    bg: 'red.500',
                    borderColor: 'red.500',
                    color: 'white',
                  }
                : {
                    bg: 'yellow.500',
                    borderColor: 'yellow.500',
                    color: 'white',
                  }
            }
            onClick={() => {
              fetch(`${apiBaseUrl}/premium`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_key,
                  premium: !userData.premium,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.status === 'success') {
                    router.reload();
                  }
                });
            }}>
            {userData.premium ? 'Disable' : 'Enable'} Premium
          </Button>
        )}
        {!userData.premium && (
          <Button
            className='paypalCheckOutButtonContainer'
            backgroundColor='#ffc439'
            height='20'
            onClick={() => {
              window.open('https://www.paypal.com/signin', 'name', 'width=400,height=600');
              fetch(`${apiBaseUrl}/premium`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_key,
                  premium: !userData.premium,
                }),
              });
            }}>
            <Image
              width='40'
              src='https://cdn.pixabay.com/photo/2015/05/26/09/37/paypal-784404_1280.png'
            />
          </Button>
        )}
      </VStack>
    </Center>
  );
};

export default Home;
