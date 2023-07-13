import { Button, Flex, HStack, Input, InputGroup, InputRightElement, Text, useBreakpointValue, useColorModeValue, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import localeContent from '../../locales/locale.json';
import { IoSend } from 'react-icons/io5';
import { useEffect, useState } from 'react';
import Filter from 'bad-words';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import wordList from './german-bad-words.json';

const GameControls = ({ socket, requestedDraw, setRequestedDraw, messages, setMessages }) => {
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const [message, setMessage] = useState('');
  const [hiddenChat, setHiddenChat] = useState(false);
  const isDesktop = useBreakpointValue({
    base: false,
    md: true,
  });
  return (
    <VStack w='12rem'>
      <MobileStack>
        <Button
          variant='millgreen'
          onClick={() => {
            socket.emit('lose');
          }}>
          {content.game.forfeit}
        </Button>
        <Button
          variant='millgreenoutline'
          onClick={() => {
            socket.emit('draw');
            setRequestedDraw('send');
          }}>
          {content.game.draw}
        </Button>
      </MobileStack>
      {requestedDraw == 'rec' && (
        <VStack>
          <Text textAlign='center'>{content.game.drawrequest}</Text>
          <Button
            variant='millgreen'
            onClick={() => {
              socket.emit('draw');
            }}>
            {content.game.drawaccept}
          </Button>
          <Button
            variant='millgreen'
            bgColor='red.500'
            _hover={{ bgColor: 'red.600' }}
            onClick={() => {
              socket.emit('draw!');
              setRequestedDraw(null);
            }}>
            {content.game.drawdecline}
          </Button>
        </VStack>
      )}
      {requestedDraw == 'send' && (
        <VStack>
          <Text textAlign='center'>{content.game.drawsent}</Text>
          <Button
            variant='millgreen'
            bgColor='red.500'
            _hover={{ bgColor: 'red.600' }}
            onClick={() => {
              socket.emit('draw!');
              setRequestedDraw(null);
            }}>
            {content.game.drawcancel}
          </Button>
        </VStack>
      )}
      <Button onClick={() => setHiddenChat(!hiddenChat)}>{hiddenChat ? <FaEyeSlash /> : <FaEye />}</Button>
      {!hiddenChat && (
        <>
          <VStack
            maxH='10rem'
            maxW={isDesktop ? '12rem' : '30rem'}
            minH='3rem'
            w='full'
            backgroundColor={useColorModeValue('blackAlpha.100', 'millgrey.300')}
            borderRadius='0.4rem'
            overflowY='auto'
            scrollbar-width='1px'
            scrollbar-color='#71a34370 transparent'
            overflowX='hidden'
            flexDirection='column-reverse'
            gap='0.2rem'
            sx={{
              '&::-webkit-scrollbar': {
                width: '5px',
                borderRadius: '8px',
                backgroundColor: `transparent`,
              },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: '8px',
                backgroundColor: `#71a34370`,
              },
            }}>
            {messages.length === 0 ? (
              <Text color={useColorModeValue('gray.700', 'teal.200')}>chat</Text>
            ) : (
              <>
                {[...messages].reverse().map((m, index) => (
                  <Text
                    key={index}
                    alignSelf={m.person == 'me' ? 'end' : 'start'}
                    textAlign={m.person == 'me' ? 'end' : 'start'}
                    p='0.4rem'
                    wordBreak='break-word'
                    color={m.person == 'me' ? 'white' : 'gray.900'}
                    backgroundColor={m.person == 'me' ? 'millgreen.500' : 'white'}
                    borderRadius='9999'
                    paddingX='1rem'>
                    {m.value}
                  </Text>
                ))}
              </>
            )}
          </VStack>
          <InputGroup>
            <Input
              variant='millgreen'
              value={message}
              placeholder='chat'
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || message === '') return;
                const filter = new Filter({ list: wordList });
                let m = '';
                try {
                  m = filter.clean(message);
                } catch (e) {
                  return;
                }
                socket.emit('message', m);
                setMessages([...messages, { person: 'me', value: m }]);
                setMessage('');
              }}
            />
            <InputRightElement>
              <Button
                size='sm'
                h='full'
                backgroundColor='millgreen.500'
                color='white'
                _hover={{
                  backgroundColor: 'millgreen.600',
                }}
                onClick={() => {
                  if (message == '') return;
                  const filter = new Filter({ list: wordList });
                  let m = '';
                  try {
                    m = filter.clean(message);
                  } catch (e) {
                    return;
                  }
                  socket.emit('message', m);
                  setMessages([...messages, { person: 'me', value: m }]);
                  setMessage('');
                }}>
                <IoSend />
              </Button>
            </InputRightElement>
          </InputGroup>
        </>
      )}
    </VStack>
  );
};

const MobileStack = ({ children }) => {
  const isDesktop = useBreakpointValue({
    base: false,
    md: true,
  });
  return <>{isDesktop ? <VStack>{children}</VStack> : <HStack>{children}</HStack>}</>;
};

export default GameControls;
