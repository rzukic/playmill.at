import {
  Center,
  Heading,
  Spinner,
  Text,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  VStack,
  Button,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
} from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import apiBaseUrl from '../../../lib/apiBaseURL';
import { UserContext } from '../../../lib/userContext';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import localeContent from '../../../locales/locale.json';
import Badge from '../../../modules/badges/badge';
import { BsInfoCircleFill } from 'react-icons/bs';

const Home = () => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const userData = useContext(UserContext);
  const session_key = getCookie('session_key');
  const [badges, setBadges] = useState(null);
  const [notOwned, setNotOwned] = useState(null);
  const [reaload, setReload] = useState(false);
  const router = useRouter();
  const { locale } = router;
  const content = localeContent.languages[locale].content;
  const toast = useToast();
  useEffect(() => {
    if (userData === null) return;
    fetch(`${apiBaseUrl}/badges?uid=${userData.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setBadges(data.badges);
        }
      });
  }, [userData, reaload]);
  useEffect(() => {
    if (badges === null) return;
    fetch(`${apiBaseUrl}/allbadges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setNotOwned(data.badges.filter((b) => !badges.some((badge) => badge.badge_id === b.badge_id)));
        }
      });
  }, [badges]);
  if (userData === null || badges === null || notOwned === null) {
    return (
      <Center m='10'>
        <Spinner />
      </Center>
    );
  }
  if (!userData) {
    return (
      <Center m='10'>
        <Heading>Not logged in</Heading>
      </Center>
    );
  }
  return (
    <Center m={isDesktop ? '10' : '4'}>
      <VStack w='full'>
        <Heading>{content.badges.title}</Heading>
        <Table
          colorScheme='teal'
          maxW='40rem'>
          <Thead>
            <Tr>
              <Th textAlign='center'>{content.badges.headers.badge}</Th>
              {isDesktop && <Th textAlign='center'>{content.badges.headers.status}</Th>}
              <Th textAlign='center'>{content.badges.headers.action}</Th>
              <Th textAlign='center'>{content.badges.headers.description}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {badges.map((badge) => (
              <Tr key={badge.badge_id}>
                <Td textAlign='center'>
                  <Center>
                    <Badge badge={badge} />
                  </Center>
                </Td>
                {isDesktop && (
                  <Td textAlign='center'>
                    {badge.active ? <Text color='green.500'>{content.badges.active}</Text> : <Text color='red.500'>{content.badges.inactive}</Text>}
                  </Td>
                )}
                <Td textAlign='center'>
                  <Button
                    onClick={() => {
                      fetch(`${apiBaseUrl}/badges`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          session_key,
                          badge_id: badge.badge_id,
                          active: !badge.active,
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.status === 'error' && data.error === 'max3') {
                            return toast({
                              title: 'Error',
                              description: content.badges.max3,
                              status: 'error',
                            });
                          }
                          setReload(!reaload);
                        });
                    }}>
                    {badge.active ? content.badges.deactivate : content.badges.activate}
                  </Button>
                </Td>
                <Td textAlign='center'>
                  <BadgeDescription
                    tag={content.badges.headers.description}
                    description={content.badges.descriptions[badge.badge_description]}
                  />
                </Td>
              </Tr>
            ))}
            {notOwned.map((badge) => (
              <Tr key={badge.badge_id}>
                <Td textAlign='center'>
                  <Center>
                    <Badge badge={badge} />
                  </Center>
                </Td>
                <Td
                  textAlign='center'
                  textColor={useColorModeValue('blackAlpha.300', 'whiteAlpha.300')}
                  colSpan={isDesktop ? 2 : 1}>
                  {content.badges.notowned}
                </Td>
                <Td textAlign='center'>
                  <BadgeDescription
                    tag={content.badges.headers.description}
                    description={content.badges.descriptions[badge.badge_description]}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Center>
  );
};

const BadgeDescription = ({ tag, description }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const cancelRef = useRef();
  return (
    <>
      <Button onClick={onOpen}>{isDesktop ? tag : <BsInfoCircleFill />}</Button>
      <AlertDialog
        motionPreset='slideInBottom'
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader
            fontSize='lg'
            fontWeight='bold'>
            {tag}
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>{description}</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose}>Ok</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Home;
