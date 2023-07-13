import { Box, Center, Heading } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function Custom404() {
  return (
    <Box h='100vh'>
      <Center h='full'>
        <Heading>404 Error - not found</Heading>
      </Center>
    </Box>
  );
}
