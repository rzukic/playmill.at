import {
  Avatar,
  Box,
  Center,
  Heading,
  HStack,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Td,
  Tooltip,
  Tr,
  useBreakpointValue,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { forwardRef, LegacyRef, useEffect, useState } from 'react';
import localeContent from '../../../locales/locale.json';
import Flag from 'react-world-flags';
import EloChart from '../../../modules/account/chart';
import apiBaseUrl from '../../../lib/apiBaseURL';

const Home = () => {
  const { player_id } = useRouter().query;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [isWaiting, setIsWaiting] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    if (player_id) {
      fetch(`${apiBaseUrl}/player?uid=${player_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status == 'success') setUserData(data.player);
          setIsWaiting(false);
        });
    }
  });
  if (isWaiting) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  } else if (!userData) {
    return (
      <Center m='12'>
        <Heading>User not found</Heading>
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
              <Avatar
                size={isDesktop ? '2xl' : 'xl'}
                name={userData.username}
                src={userData.image}
                m={isDesktop ? '10' : 'auto'}
              />
            </Box>
            <Center p={isDesktop ? '10' : 'auto'}>
              <Heading>{userData.username}</Heading>
            </Center>
          </HStack>
          <Table colorScheme='teal'>
            <Tbody>
              <Tr>
                <Td textAlign='center'>{content.account.country}</Td>
                <Td textAlign='center'>
                  <Center>
                    <Country
                      country_code={userData.country_code}
                      country_name={userData.country_name}
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
                <Td textAlign='center'>{userData.elo ? userData.elo : 'Not ranked yet.'}</Td>
              </Tr>
            </Tbody>
          </Table>
          <Spacer />
        </VStack>
        <Center
          p={isDesktop ? '20' : '0'}
          w='full'>
          <EloChart
            userData={userData}
            uid={Number(player_id)}
          />
        </Center>
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

export default Home;
