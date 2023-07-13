import {
  Avatar,
  Box,
  Center,
  Heading,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Tooltip,
  Tr,
  VStack,
  useColorModeValue,
  useBreakpointValue,
  Button,
  Spacer,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Input,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { forwardRef, LegacyRef, useContext, useEffect, useState } from 'react';
import { UserContext } from '../../../lib/userContext';
import Flag from 'react-world-flags';
import localeContent from '../../../locales/locale.json';
import { getCookie } from 'cookies-next';
import apiBaseUrl from '../../../lib/apiBaseURL';
import { FaTrash } from 'react-icons/fa';

const Home = () => {
  const myUserData = useContext(UserContext);
  const { uid } = useRouter().query;
  const [userData, setUserData] = useState(null);
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const session_key = getCookie('session_key');
  const router = useRouter();
  useEffect(() => {
    if (uid) {
      fetch(`${apiBaseUrl}/admin/user?uid=${uid}&session_key=${session_key}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status == 'success') setUserData(data.user);
          else setUserData(false);
        });
    }
  }, [uid]);
  if (myUserData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>Please login</Heading>
        </VStack>
      </Center>
    );
  }
  if (userData === null || myUserData === null) {
    return (
      <Center m='10'>
        <VStack>
          <Spinner />
        </VStack>
      </Center>
    );
  }
  if (!myUserData.admin) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>You are not an admin</Heading>
        </VStack>
      </Center>
    );
  }
  if (userData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>User not found</Heading>
        </VStack>
      </Center>
    );
  }
  return (
    <Center m='10'>
      <VStack>
        <Heading size='lg'>Welcome to the User Dashboard</Heading>
        <HStack>
          <Box>
            <AvatarModal
              userData={userData}
              session_key={session_key}
              uid={uid}
            />
          </Box>
          <Center p={isDesktop ? '10' : 'auto'}>
            <VStack>
              <Heading>{userData.username}</Heading>
              <ChangingModal
                toChange='Username'
                change={(value) => {
                  fetch(`${apiBaseUrl}/admin/username`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      uid,
                      session_key,
                      username: value,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => data.status == 'success' && router.reload());
                }}
              />
            </VStack>
          </Center>
        </HStack>
        <Table colorScheme='teal'>
          <Tbody>
            <Tr>
              {isDesktop && <Td textAlign='center'>Email</Td>}
              <Td textAlign='center'>{userData.email}</Td>
              <Td textAlign='center'>
                <ChangingModal
                  toChange='Email'
                  change={(value) => {
                    fetch(`${apiBaseUrl}/admin/email`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        uid,
                        session_key,
                        email: value,
                      }),
                    })
                      .then((res) => res.json())
                      .then((data) => data.status == 'success' && router.reload());
                  }}
                />
              </Td>
            </Tr>
            <Tr>
              {isDesktop && <Td textAlign='center'>{content.account.country}</Td>}
              <Td textAlign='center'>
                <Center>
                  <Country
                    country_code={userData.country_code}
                    country_name={userData.country_name}
                  />
                </Center>
              </Td>
              <Td textAlign='center'></Td>
            </Tr>
            <Tr>
              {isDesktop && <Td textAlign='center'>{content.account.since}</Td>}
              <Td textAlign='center'>{new Date(userData.registered_date).toLocaleDateString('de-DE')}</Td>
              <Td textAlign='center'></Td>
            </Tr>
            <Tr>
              {isDesktop && <Td textAlign='center'>Role</Td>}
              <Td
                textAlign='center'
                color={userData.admin && 'yellow.500'}>
                {userData.admin ? 'Administrator' : 'Normal user'}
              </Td>
              <Td textAlign='center'>
                {userData.admin ? (
                  <Button
                    onClick={() => {
                      fetch(`${apiBaseUrl}/admin/admin`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          uid,
                          session_key,
                          admin: false,
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => data.status == 'success' && router.reload());
                    }}>
                    Demote
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      fetch(`${apiBaseUrl}/admin/admin`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          uid,
                          session_key,
                          admin: true,
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => data.status == 'success' && router.reload());
                    }}>
                    Promote
                  </Button>
                )}
              </Td>
            </Tr>
          </Tbody>
        </Table>
        <Button
          color='color.500'  
        >
          Ban
        </Button>
      </VStack>
    </Center>
  );
};

const CustomCard = forwardRef(({ country_code, ...rest }: { country_code }, ref) => (
  <Box p='1'>
    <span
      ref={ref as LegacyRef<HTMLDivElement>}
      {...rest}>
      <Flag
        code={country_code}
        width='50'
      />
    </span>
  </Box>
));

const Country = ({ country_code, country_name }) => {
  return (
    <Tooltip
      label={country_name}
      placement='left'
      color={useColorModeValue('gray.800', 'white')}
      bg={useColorModeValue('gray.100', 'millgrey.300')}>
      <CustomCard country_code={country_code} />
    </Tooltip>
  );
};

const ChangingModal = ({ toChange, change }): any => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newValue, setNewValue] = useState('');
  return (
    <>
      <Button onClick={onOpen}>Edit</Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change {toChange}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              variant='millgreen'
              placeholder={`New ${toChange}`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              w='full'
              variant='millgreen'
              onClick={() => change(newValue)}>
              Change
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const AvatarModal = ({ userData, uid, session_key }) => {
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
          <ModalHeader>Delete Picture</ModalHeader>
          <ModalCloseButton />
          <ModalFooter>
            <Button
              w='full'
              bg='red.500'
              color='white'
              _hover={{ backgroundColor: 'red.600' }}
              onClick={() => {
                fetch(`${apiBaseUrl}/admin/image`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    uid,
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
