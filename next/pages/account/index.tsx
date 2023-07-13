import {
  Avatar,
  Box,
  Button,
  Center,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Td,
  Tr,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { useContext, useEffect, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import Flag from 'react-world-flags';
import EditButton from '../../modules/account/editbutton';
import { BiLineChart } from 'react-icons/bi';
import EloChart from '../../modules/account/chart';
import { UserContext } from '../../lib/userContext';
import { useRouter } from 'next/router';
import PasswordChanger from '../../modules/account/passwordchanger';
import localeContent from '../../locales/locale.json';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const userData = useContext(UserContext);
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  if (userData === null) {
    return <Spinner />;
  } else if (!userData) {
    return (
      <Center m='12'>
        <Heading>Not logged in</Heading>
      </Center>
    );
  }
  return (
    <Center m={isDesktop ? '10' : '4'}>
      <VStack w='full'>
        <VStack>
          <Spacer />
          <HStack>
            <Box>
              <AvatarModal
                userData={userData}
                session_key={getCookie('session_key')}
              />
            </Box>
            <Center p={isDesktop ? '10' : 'auto'}>
              <Heading>{userData.username}</Heading>
            </Center>
          </HStack>
          <Table colorScheme='teal'>
            <Tbody>
              <Tr>
                <Td textAlign='center'>Email</Td>
                <Td textAlign='center'>{userData.email}</Td>
              </Tr>
              <Tr>
                <Td textAlign='center'>{content.account.country}</Td>
                <Td textAlign='center'>
                  <Center>
                    <Flag
                      code={userData.country_code}
                      width='50'
                    />
                  </Center>
                </Td>
              </Tr>
              <Tr>
                <Td textAlign='center'>{content.account.since}</Td>
                <Td textAlign='center'>{new Date(userData.registered_date).toLocaleDateString('de-DE')}</Td>
              </Tr>
              <Tr>
                <Td textAlign='center'>(M)Elo</Td>
                <Td textAlign='center'>{userData.elo ? userData.elo : 'Play more games to see your (M)ELO!'}</Td>
              </Tr>
              <Tr>
                <Td colSpan={2}>
                  <Center>
                    <Button onClick={() => router.push('/account/badges', '/account/badges', { locale })}>See my Badges</Button>
                  </Center>
                </Td>
              </Tr>
            </Tbody>
          </Table>
          <Spacer />
          <HStack>
            <EditButton />
            <PasswordChanger />
          </HStack>
          <Button
            variant='millgreen'
            onClick={() => router.push('/games', '/games', { locale })}>
            {content.account.viewgames}
          </Button>
        </VStack>
        <Center
          p={isDesktop ? '20' : '0'}
          w='full'>
          <EloChart
            userData={userData}
            uid={userData.uid}
          />
        </Center>
      </VStack>
    </Center>
  );
};

const AvatarModal = ({ userData, session_key }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const router = useRouter();
  return (
    <>
      <Avatar
        size={isDesktop ? '2xl' : 'xl'}
        name={userData.username}
        src={userData.image}
        m={isDesktop ? '10' : 'auto'}
        border='2px solid transparent'
        _hover={{ backgroundColor: 'red.500', cursor: 'pointer', borderColor: 'red.500' }}
        onClick={onOpen}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Image</ModalHeader>
          <ModalCloseButton />
          <ModalFooter>
            <Button
              w='full'
              bg='red.500'
              color='white'
              _hover={{ backgroundColor: 'red.600' }}
              onClick={() => {
                fetch(`${apiBaseUrl}/account/image`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    session_key,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => data.status == 'success' && router.reload());
              }}>
              Confirm Deletion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Home;
