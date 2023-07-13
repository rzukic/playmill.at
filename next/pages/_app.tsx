import '../styles/globals.css';

import Script from 'next/script';
import { Box, ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import Navbar from '../modules/nav/navbar';
import theme from '../lib/theme';
import { UserContext } from '../lib/userContext';
import { getCookie } from 'cookies-next';
import { useEffect, useState } from 'react';
import apiBaseUrl from '../lib/apiBaseURL';
import Head from 'next/head';
import Footer from '../modules/footer/footer';

function MyApp({ Component, pageProps }) {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const session_key = getCookie('session_key');
    if (session_key) {
      fetch(`${apiBaseUrl}/account?session_key=${session_key}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setUserData(data.account);
          } else {
            setUserData(false);
          }
        });
    } else {
      setUserData(false);
    }
  }, []);
  return (
    <>
      <Head>
        <title>Play mill online</title>
      </Head>
      <Script
        async
        defer
        data-website-id='c6eb0bf4-6a94-4d06-ac24-ac18bcac7bf2'
        src='https://statistics.zukic.net/script.js'
      />
      <UserContext.Provider value={userData}>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Box minH='95vh'>
            <Navbar />
            <Component {...pageProps} />
          </Box>
          <Footer />
        </ChakraProvider>
      </UserContext.Provider>
    </>
  );
}

export default MyApp;
