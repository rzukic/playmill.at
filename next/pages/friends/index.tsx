import {
  Avatar,
  Center,
  Heading,
  HStack,
  useBreakpointValue,
  VStack,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  Button,
  IconButton,
  Menu,
  useDisclosure,
  MenuList,
  MenuItem,
  MenuButton,
  Spinner,
  Input,
} from '@chakra-ui/react';
import { TiDelete, TiMinus, TiPlus } from 'react-icons/ti';
import { BiDotsVerticalRounded, BiX } from 'react-icons/bi';
import { useContext, useEffect, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import { getCookie } from 'cookies-next';
import Router, { useRouter } from 'next/router';
import { UserContext } from '../../lib/userContext';
import { Manager } from 'socket.io-client';
import wsBaseURL from '../../lib/wsBaseURL';
import localeContent from '../../locales/locale.json';

const Home = () => {
  const userData = useContext(UserContext);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  if (userData === null) {
    return <Spinner />;
  }
  if (!userData) {
    return (
      <Center m='12'>
        <Heading>Not logged in</Heading>
      </Center>
    );
  }
  return (
    <Center m='10'>
      <VStack
        wrap='wrap'
        gap='10'
        justifyContent='center'
      >
        <Friends />
        <VStack>
          <Heading>{content.friends.add}</Heading>
          <AddFriends />
        </VStack>
        {isDesktop ? (
          <HStack gap='5'>
            <VStack>
              <Heading>{content.friends.request}</Heading>
              <Heading size='md'>{content.friends.sent}</Heading>
              <SentRequests />
              <Heading size='md'>{content.friends.recieved}</Heading>
              <RecievedRequests />
            </VStack>
            <VStack>
              <Heading>{content.friends.challenge}</Heading>
              <RecievedChallenges />
            </VStack>
          </HStack>
        ) : (
          <>
            <VStack>
              <Heading>{content.friends.request}</Heading>
              <Heading size='md'>{content.friends.sent}</Heading>
              <SentRequests />
              <Heading size='md'>{content.friends.sent}</Heading>
              <RecievedRequests />
            </VStack>
            <VStack>
              <Heading>{content.friends.challenge}</Heading>
              <RecievedChallenges />
            </VStack>
          </>
        )}
      </VStack>
    </Center>
  );
};

export default Home;

const Friends = () => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const session_key = getCookie('session_key');
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/friends?session_key=${session_key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 'success') setFriends(data.friends);
        setIsLoading(false);
      });
  }, []);
  const [sock, setSock] = useState(null);
  if (isLoading) return <Spinner />;
  if (friends.length == 0)
    return (
      <VStack>
        <Heading>{content.friends.title}</Heading>
        <Text>{content.friends.nofriends}</Text>
      </VStack>
    );
  return (
    <VStack>
      <Heading>{content.friends.title}</Heading>
      <Table>
        <Tbody>
          {friends.map((a) => (
            <Tr key={a.uid}>
              <Td p='16px'>
                <Avatar
                  name={a.username}
                  src={a.image}
                />
              </Td>
              <Td p='16px'>
                <Text>{a.username}</Text>
              </Td>
              <Td p='16px'>
                <Text>{a.elo} Elo</Text>
              </Td>
              {isDesktop ? (
                <>
                  <Td p='16px'>
                    {pending == a.uid ? (
                      <Button
                        variant='millgreen'
                        bgColor='red.500'
                        _hover={{ bgColor: 'red.600' }}
                        onClick={() => {
                          if (typeof window === 'undefined' || !sock) return;
                          sock.disconnect();
                          setPending(null);
                          setSock(null);
                        }}
                      >
                        {content.game.drawcancel}
                      </Button>
                    ) : (
                      <Button
                        variant='millgreen'
                        isDisabled={pending}
                        onClick={() => {
                          if (typeof window === 'undefined') return;
                          const challengeManager = new Manager(`${wsBaseURL}`);
                          const challengeSocket = challengeManager.socket('/challenge', {
                            auth: {
                              session_key: session_key,
                              friend_uid: a.uid,
                              mode_id: 2,
                            },
                          });
                          setSock(challengeSocket);
                          challengeSocket.on('success', () => {
                            setPending(a.uid);
                          });
                          challengeSocket.on('gameFound', (game_id) => {
                            router.push(`/game/${game_id}`, `/game/${game_id}`, {
                              locale,
                            });
                          });
                        }}
                      >
                        {content.friends.challenge}
                      </Button>
                    )}
                  </Td>
                  <Td p='16px'>
                    <IconButton
                      aria-label='delete'
                      color='red.500'
                      variant='outline'
                      borderColor='red.500'
                      fontSize='20'
                      icon={<TiDelete />}
                      onClick={() => {
                        fetch(`${apiBaseUrl}/friend`, {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            session_key: session_key,
                            friend_uid: a.uid,
                          }),
                        })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.status == 'success') {
                              setFriends(friends.filter((b) => b.uid != a.uid));
                            }
                          });
                      }}
                    />
                  </Td>
                </>
              ) : (
                <>
                  <Td p='16px'>
                    {pending != a.uid && pending ? (
                      <IconButton
                        aria-label='extras'
                        icon={<BiDotsVerticalRounded />}
                        isDisabled
                      />
                    ) : (
                      <>
                        {pending == a.uid ? (
                          <IconButton
                            aria-label='cancel'
                            icon={<BiX />}
                            onClick={() => {
                              if (typeof window == 'undefined' || !sock) return;
                              sock.disconnect();
                              setPending(null);
                              setSock(null);
                            }}
                          />
                        ) : (
                          <FriendExtras
                            onDelete={() => {
                              fetch(`${apiBaseUrl}/friend`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  session_key: session_key,
                                  friend_uid: a.uid,
                                }),
                              })
                                .then((res) => res.json())
                                .then((data) => {
                                  if (data.status == 'success') {
                                    setFriends(friends.filter((b) => b.uid != a.uid));
                                  }
                                });
                            }}
                            onChallenge={() => {
                              if (typeof window == 'undefined') return;
                              const challengeManager = new Manager(`${wsBaseURL}`);
                              const challengeSocket = challengeManager.socket('/challenge', {
                                auth: {
                                  session_key: session_key,
                                  friend_uid: a.uid,
                                  mode_id: 2,
                                },
                              });
                              setSock(challengeSocket);
                              challengeSocket.on('success', () => {
                                setPending(a.uid);
                              });
                              challengeSocket.on('gameFound', (game_id) => {
                                router.push(`/game/${game_id}`, `/game/${game_id}`, { locale });
                              });
                            }}
                          />
                        )}
                      </>
                    )}
                  </Td>
                </>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

const AddFriends = () => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const session_key = getCookie('session_key');
  const userData = useContext(UserContext);
  const search = (e) => {
    setIsLoading(true);
    if (username == '') {
      setIsLoading(false);
      setFriends([]);
      return;
    }
    fetch(`${apiBaseUrl}/query/account?query=${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 'success') setFriends(data.accounts.filter((a) => a.uid != userData.uid));
        setIsLoading(false);
      });
  };
  return (
    <>
      <Input
        variant='millgreen'
        placeholder='Username'
        onChange={(e) => setUsername(e.target.value)}
      />
      {isLoading ? (
        <></>
      ) : (
        <Button
          variant='millgreen'
          onClick={search}
        >
          Search Name
        </Button>
      )}
      {isLoading ? (
        <Spinner />
      ) : (
        <Table>
          <Tbody>
            {friends.map((a) => (
              <Tr key={a.uid}>
                <Td p='16px'>
                  <Avatar
                    name={a.username}
                    src={a.image}
                  />
                </Td>
                <Td p='16px'>
                  <HStack>
                    <Text>{a.username}</Text>
                    <Text color='gray.500'>uid: {a.uid}</Text>
                  </HStack>
                </Td>
                <Td p='16px'>
                  <Button
                    variant='millgreen'
                    onClick={() => {
                      fetch(`${apiBaseUrl}/request/friend`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          session_key: session_key,
                          friend_uid: a.uid,
                          message: 'Hello!',
                        }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.status == 'success') {
                            setFriends(friends.filter((b) => b.uid != a.uid));
                          }
                        });
                    }}
                  >
                    Add
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

const FriendExtras = ({ onChallenge = null, onDelete = null }) => {
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  return (
    <Menu variant='millgreen'>
      <MenuButton
        as={IconButton}
        icon={<BiDotsVerticalRounded />}
      />
      <MenuList>
        <MenuItem onClick={onChallenge}>{content.friends.challenge}</MenuItem>
        <MenuItem onClick={onDelete}>{content.friends.remove}</MenuItem>
      </MenuList>
    </Menu>
  );
};

const SentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const session_key = getCookie('session_key');
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/friends/request/sent?session_key=${session_key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 'success') setRequests(data.requests);
        setIsLoading(false);
      });
  }, []);
  if (isLoading) return <Spinner />;
  if (requests.length == 0) return <Text>{content.friends.nosent}</Text>;
  return (
    <Table>
      <Tbody>
        {requests.map((a) => (
          <Tr key={a.uid}>
            <Td p='16px'>
              <Avatar
                name={a.username}
                src={a.image}
              />
            </Td>
            <Td p='16px'>
              <Text>{a.username}</Text>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const RecievedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const session_key = getCookie('session_key');
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/friends/request/received?session_key=${session_key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 'success') setRequests(data.requests);
        setIsLoading(false);
      });
  }, []);
  if (isLoading) return <Spinner />;
  if (requests.length == 0) return <Text>{content.friends.norec}</Text>;
  return (
    <Table>
      <Tbody>
        {requests.map((a) => (
          <Tr key={a.uid}>
            <Td p='16px'>
              <Avatar
                name={a.username}
                src={a.image}
              />
            </Td>
            <Td p='16px'>
              <Text>{a.username}</Text>
            </Td>
            <Td p='5px'>
              <IconButton
                variant='millgreen'
                aria-label='accept'
                icon={<TiPlus />}
                onClick={() => {
                  fetch(`${apiBaseUrl}/request/friend/accept`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      session_key: session_key,
                      friend_uid: a.uid,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.status == 'success') {
                        router.reload();
                      }
                    });
                }}
              />
            </Td>
            <Td p='5px'>
              <IconButton
                variant='solid'
                color='white'
                bg='red.500'
                aria-label='decline'
                icon={<TiMinus />}
                onClick={() => {
                  fetch(`${apiBaseUrl}/request/friend/decline`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      session_key: session_key,
                      friend_uid: a.uid,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.status == 'success') {
                        router.reload();
                      }
                    });
                }}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const RecievedChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const session_key = getCookie('session_key');
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/friends/challenge?session_key=${session_key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status == 'success') setChallenges(data.challenges);
        setIsLoading(false);
      });
  }, []);
  if (isLoading) return <Spinner />;
  if (challenges.length == 0) return <Text>{content.friends.nochallenges}</Text>;
  return (
    <Table>
      <Tbody>
        {challenges.map((a) => (
          <Tr key={a.uid}>
            <Td p='16px'>
              <Avatar
                name={a.username}
                src={a.image}
              />
            </Td>
            <Td p='16px'>
              <Text>{a.username}</Text>
            </Td>
            <Td p='5px'>
              <Button
                variant='millgreen'
                onClick={() => {
                  fetch(`${apiBaseUrl}/challenge/accept`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      session_key: session_key,
                      friend_uid: a.uid,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.status == 'success') {
                        router.push(`/game/${data.game_id}`, `/game/${data.game_id}`, { locale });
                      } else {
                        router.reload();
                      }
                    });
                }}
              >
                {content.friends.accept}
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
