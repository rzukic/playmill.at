import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import {
  Avatar,
  Button,
  Center,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Spinner,
  useBreakpointValue,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import AccountModal from './accountmodal';
import { useState, useEffect, useContext } from 'react';
import apiBaseUrl from '../../../lib/apiBaseURL';
import { BsFillMoonFill, BsFillSunFill } from 'react-icons/bs';
import { FiLogOut, FiShield, FiStar, FiUser, FiUsers } from 'react-icons/fi';
import { RiDashboard2Line } from 'react-icons/ri';
import { useRouter } from 'next/router';
import { UserContext } from '../../../lib/userContext';
import localeContent from '../../../locales/locale.json';
import Flag from 'react-world-flags';

const AccountButtons = ({ onClose = () => {} }) => {
  const userData = useContext(UserContext);
  const { colorMode, toggleColorMode } = useColorMode();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const { locale, locales, asPath } = useRouter();
  const content = localeContent.languages[locale].content;
  const flag = localeContent.languages[locale].flag;
  const router = useRouter();
  return (
    <>
      <Menu
        placement='bottom-end'
        variant='millgreen'>
        <MenuButton
          as={isDesktop ? IconButton : Button}
          icon={
            isDesktop ? (
              <Flag
                code={flag}
                width='30'
              />
            ) : (
              <></>
            )
          }
          p={isDesktop && '2'}>
          <HStack
            w='full'
            justifyContent='center'>
            <Text>{localeContent.languages[locale].nativeName}</Text>
            <Flag
              code={flag}
              width='30'
            />
          </HStack>
        </MenuButton>
        <MenuList>
          {locales
            .filter((a) => a != locale)
            .map((l) => (
              <MenuItem
                key={l}
                onClick={() => {
                  router.push(asPath, asPath, {
                    locale: l,
                  });
                  onClose();
                }}>
                {localeContent.languages[l].nativeName}
                <Spacer />
                <Flag
                  code={localeContent.languages[l].flag}
                  width='40'
                />
              </MenuItem>
            ))}
        </MenuList>
      </Menu>
      <Button onClick={toggleColorMode}>
        {isDesktop ? (
          colorMode === 'light' ? (
            <BsFillMoonFill />
          ) : (
            <BsFillSunFill />
          )
        ) : colorMode === 'light' ? (
          content.navbar.swdm
        ) : (
          content.navbar.swlm
        )}
      </Button>
      {userData == null ? (
        <Spinner />
      ) : userData ? (
        <>
          <Center>
            <Menu variant='millgreen'>
              <MenuButton
                as={Button}
                leftIcon={
                  isDesktop && (
                    <Avatar
                      ml='-3'
                      name={userData.username}
                      src={userData.image}
                    />
                  )
                }
                pl={isDesktop ? '0' : 'auto'}
                width={isDesktop ? 'auto' : 'full'}
                ml={isDesktop ? '2' : 'auto'}>
                {userData.username}
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() => {
                    router.push('/account', '/account', { locale });
                    onClose();
                  }}>
                  {content.navbar.profile} <Spacer /> <FiUser />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    router.push('/friends', '/friends', { locale });
                    onClose();
                  }}>
                  {content.navbar.friends} <Spacer /> <FiUsers />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    const session_key = getCookie('session_key');
                    if (session_key) {
                      fetch(`${apiBaseUrl}/logout?session_key=${session_key}`)
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.status === 'success') {
                            deleteCookie('session_key');
                            router.reload();
                          }
                        });
                    }
                  }}
                  color='red.500'
                  _hover={{
                    bgColor: 'red.500',
                    color: 'white',
                  }}>
                  {content.navbar.logout} <Spacer /> <FiLogOut />
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    router.push('/premium', '/premium', { locale });
                    onClose();
                  }}
                  color='yellow.500'
                  _hover={{
                    bgColor: 'yellow.500',
                    color: 'white',
                  }}>
                  {userData.premium ? 'Premium' : content.navbar.premium} <Spacer /> <FiStar />
                </MenuItem>
                {userData.admin && (
                  <MenuItem
                    onClick={() => {
                      router.push('/admin', '/admin', { locale });
                      onClose();
                    }}
                    color='blue.500'
                    _hover={{
                      bgColor: 'blue.500',
                      color: 'white',
                    }}>
                    Administration <Spacer /> <FiShield />
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </Center>
        </>
      ) : (
        <AccountModal />
      )}
    </>
  );
};

export default AccountButtons;
