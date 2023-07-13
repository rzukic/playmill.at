import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box
      w='full'
      textAlign='center'
      h='5vh'
    >
      <Text color={useColorModeValue('blackAlpha.300', 'whiteAlpha.300')}>© Ruben Zukic, Leopold Kainz, Anna Windhager 2023</Text>
    </Box>
  );
};

export default Footer;
