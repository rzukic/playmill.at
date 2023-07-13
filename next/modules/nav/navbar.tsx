import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  IconButton,
  useBreakpointValue,
  useColorModeValue,
  Spacer,
  AspectRatio,
  Center,
  Avatar,
  Text,
  defineStyle,
  useRadioGroup,
  Image,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AccountButtons from './acc_management/accountbuttons';
import NavDrawer from './navdrawer';
import textFieldContent from '../../locales/locale.json';
import Logo from './logo.svg';

const Navbar = () => {
  const router = useRouter();
  const { locale, locales, asPath } = useRouter();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const content = textFieldContent.languages[locale].content;
  const fullButtons = ['play', 'leaderboard', 'learn', 'about'];
  return (
    <>
      <Flex
        boxShadow={useColorModeValue('lg', 'lg')}
        bgColor={useColorModeValue('white', 'millgrey.300')}
        position='fixed'
        w='full'
        top='0'
        zIndex='2'>
        <Flex>
          <Center>
            <Button
              variant='ghost'
              h='full'
              borderRadius='0'
              onClick={() => router.push('/', '/', { locale })}>
              <Image
                src={Logo.src}
                alt='logo'
                width='10'
              />
            </Button>
          </Center>
          {isDesktop && (
            <Flex>
              <HStack>
                <ButtonGroup
                  h='full'
                  spacing='0'>
                  {fullButtons
                    .map((a) => ({
                      route: a,
                      name: content.navbar[a],
                    }))
                    .map((a) => (
                      <Button
                        key={a.route}
                        h='full'
                        borderRadius='0'
                        fontSize='lg'
                        variant='ghost'
                        fontWeight='normal'
                        onClick={() => router.push(`/${a.route}`, `/${a.route}`, { locale })}>
                        {a.name}
                      </Button>
                    ))}
                </ButtonGroup>
              </HStack>
            </Flex>
          )}
        </Flex>
        <Spacer />
        <Box p='4'>
          {isDesktop ? (
            <Center h='full'>
              <HStack spacing='4'>
                <AccountButtons />
              </HStack>
            </Center>
          ) : (
            <Center
              h='full'
              px={2}>
              <NavDrawer />
            </Center>
          )}
        </Box>
      </Flex>
      <Box h='4.5rem' />
    </>
  );
};

export default Navbar;
