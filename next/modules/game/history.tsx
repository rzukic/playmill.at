import { HStack, Table, Tbody, Tr, Text, Td, Box, VStack } from '@chakra-ui/react';
import { BiChevronRight, BiX } from 'react-icons/bi';

const History = ({ history, h = 'full', w = 'full', heading }) => (
  <VStack
    h={h}
    w={w}>
    <Text
      fontWeight='bold'
      w='full'
      textAlign='center'>
      {heading}
    </Text>
    <Box
      overflowY='auto'
      overflowX='hidden'
      scrollbar-width='1px'
      scrollbar-color='#71a34370 transparent'
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
      <Table
        variant='simple'
        colorScheme='millgrey'>
        <Tbody>
          {history.map((a, index) => (
            <Tr key={index}>
              <Td p='1.5'>
                <Text
                  w='full'
                  textAlign='center'>
                  {a.action == 'move' ? a.from : ''}
                </Text>
              </Td>
              <Td p='1.5'>{a.action == 'move' ? <BiChevronRight /> : <BiX />}</Td>
              <Td p='1.5'>
                <Text
                  textAlign='center'
                  w='full'>
                  {a.action == 'move' ? a.to : a.from}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  </VStack>
);

export default History;
