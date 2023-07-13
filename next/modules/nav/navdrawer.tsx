import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { FiMenu } from 'react-icons/fi';
import AccountButtons from './acc_management/accountbuttons';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';

const NavDrawer = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const drawButtons = ['home', 'play', 'leaderboard', 'learn', 'about'];
  return (
    <>
      <IconButton
        ref={btnRef}
        variant='ghost'
        icon={<FiMenu fontSize='1.25rem' />}
        aria-label='Open Menu'
        onClick={onOpen}
      />
      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
        finalFocusRef={btnRef}
        size='full'>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Center>{content.navbar.menu}</Center>
          </DrawerHeader>
          <DrawerBody>
            <ButtonGroup
              flexDirection='column'
              w='full'
              spacing='0'>
              {drawButtons
                .map((a) => ({
                  route: a,
                  name: content.navbar[a],
                }))
                .map((a) => (
                  <Button
                    key={a.route}
                    w='full'
                    borderRadius='0'
                    fontSize='lg'
                    variant='ghost'
                    fontWeight='normal'
                    onClick={() =>
                      router.push(a.route == 'home' ? '/' : `/${a.route}`, a.route == 'home' ? '/' : `/${a.route}`, { locale }) && onClose()
                    }>
                    {a.name}
                  </Button>
                ))}
            </ButtonGroup>
          </DrawerBody>
          <Box
            w='full'
            pos='sticky'
            bottom='0'>
            <DrawerFooter>
              <ButtonGroup
                flexDirection='column'
                w='full'
                spacing='0'
                gap='2'>
                <AccountButtons onClose={onClose} />
              </ButtonGroup>
            </DrawerFooter>
          </Box>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NavDrawer;
