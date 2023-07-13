import {
  Button,
  Center,
  Heading,
  IconButton,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Td,
  Th,
  Thead,
  Toast,
  Tr,
  useBreakpointValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { useContext, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import { UserContext } from '../../lib/userContext';
import { BiDotsVerticalRounded } from 'react-icons/bi';
const Home = () => {
  const userData = useContext(UserContext);
  const session_key = getCookie('session_key');
  const [users, setUsers] = useState([]);
  const toast = useToast();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  if (userData === false) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>Please login</Heading>
        </VStack>
      </Center>
    );
  }
  if (userData === null) {
    return (
      <Center m='10'>
        <Spinner />
      </Center>
    );
  }
  if (!userData.admin) {
    return (
      <Center m='10'>
        <VStack>
          <Heading size='lg'>You are not an admin</Heading>
        </VStack>
      </Center>
    );
  }
  return (
    <Center m='10'>
      <VStack>
        <Heading size='lg'>Welcome to the Admin Dashboard</Heading>
        <Heading size='md'>Search for Users</Heading>
        <Input
          variant='millgreen'
          placeholder='Username'
          onChange={async (e) => {
            if (e.target.value == '') {
              setUsers([]);
              return;
            }
            const res = await fetch(`${apiBaseUrl}/admin/users?name=${e.target.value}&session_key=${session_key}`);
            const data = await res.json();
            if (data.status == 'success') {
              setUsers(data.users);
            } else {
              toast({
                title: 'Error',
                description: data.error,
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }}
        />
        <Heading size='md'>Users</Heading>
        <Table colorScheme='teal'>
          <Thead>
            <Tr>
              <Th>id</Th>
              <Th>Username</Th>
              {isDesktop && <Th>email</Th>}
              <Th></Th>
            </Tr>
          </Thead>
          <tbody>
            {users.map((user) => (
              <Tr key={user.uid}>
                <Td>{user.uid}</Td>
                <Td>{user.username}</Td>
                {isDesktop && <Td>{user.email}</Td>}
                <Td>
                  <Link href={`/admin/users/${user.uid}`}>
                    {isDesktop ? (
                      <Button variant='millgreen'>View</Button>
                    ) : (
                      <IconButton
                        aria-label='View'
                        icon={<BiDotsVerticalRounded />}
                        variant='millgreen'
                      />
                    )}
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </VStack>
    </Center>
  );
};

export default Home;
