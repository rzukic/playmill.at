import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useContext, useEffect, useState } from 'react';
import { Center, Heading, HStack, Spinner, VStack, Text, Image, Button, useBreakpointValue, Highlight } from '@chakra-ui/react';
import { UserContext } from '../lib/userContext';
import Flag from 'react-world-flags';
import millBoard from '../lib/resources/board.svg';
import { useRouter } from 'next/router';
import apiBaseUrl from '../lib/apiBaseURL';
import localeContent from '../locales/locale.json';

export default function Home() {
  const userData = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userCount, setuserCount] = useState(0);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/stats/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.count) {
          setuserCount(data.count);
        }
        setLoading(false);
      });
  }, []);
  if (userData === null || loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }
  return (
    <Center m={isDesktop ? '10' : '2'}>
      <VStack
        w='full'
        gap='2'>
        <Heading textAlign='center'>{content.index.welcome}</Heading>
        {userCount && (
          <HStack>
            <Text
              fontWeight='bold'
              textAlign='center'>
              <span style={{ color: '#71a343' }}>{userCount as any}</span> {content.index.waiting}
            </Text>
          </HStack>
        )}
        <Image
          src={millBoard.src}
          height={isDesktop ? '500' : '95vw'}
        />
        <Heading size='md'>
          {userData ? (
            <VStack>
              <Text>{content.index.welcomeback}</Text>
              <HStack>
                <Text>{userData.username}</Text>
                <Flag
                  code={userData.country_code}
                  width='50'
                />
              </HStack>
            </VStack>
          ) : (
            <VStack>
              <Text textAlign='center'>
                {content.index.notloggeg}
                <br /> {content.index.createacc}
              </Text>
            </VStack>
          )}
        </Heading>
        <Button
          variant='millgreen'
          onClick={() => router.push('/play', '/play', { locale: locale })}>
          {content.play.online.queue}
        </Button>
      </VStack>
    </Center>
  );
}
