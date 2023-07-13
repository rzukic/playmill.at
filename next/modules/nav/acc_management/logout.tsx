import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  HStack,
  Spinner,
  Toast,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import apiBaseUrl from '../../../lib/apiBaseURL';
import localeContent from '../../../locales/locale.json';

const Logout = ({ email, password }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const router = useRouter();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(
      `${apiBaseUrl}/logout/remote?action=query&email=${email}&password=${password}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setDevices(data.sessions);
          setIsLoading(false);
        } else {
          setDevices([]);
          setIsLoading(false);
        }
      });
  }, []);
  const logout = (key) => {
    fetch(
      `${apiBaseUrl}/logout/remote?action=logout&email=${email}&password=${password}&session_key=${key}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          fetch(`${apiBaseUrl}/login?email=${email}&password=${password}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.status === 'success') {
                setCookie('session_key', data.session_key);
                Toast({
                  title: content.navbar.statuses.loggedin,
                  description: content.navbar.statuses.successlogin,
                  status: 'success',
                });
                router.reload();
              } else {
                Toast({
                  title: content.navbar.statuses.failed,
                  description: data.error,
                  status: 'error',
                });
              }
            });
        } else {
          Toast({
            title: content.navbar.statuses.failed,
            description: data.error,
            status: 'error',
          });
        }
      });
  };
  if (!email || !password) return <label>Missing Password or Email</label>;
  if (isLoading) return <Spinner />;
  if (devices.length === 0) return <label>Something went wrong</label>;
  return (
    <>
      <VStack w='full'>
        <Heading size={isDesktop ? 'md' : 'sm'}>
          {content.navbar.logoutfromdev}
        </Heading>
        {devices.map((device) => (
          <Card>
            <CardBody>
              <VStack>
                <Heading size='md'>{device.device}</Heading>
                {isDesktop && (
                  <>
                    <label>OS: {device.os}</label>
                  </>
                )}
                <label>
                  {content.navbar.loggedout}:{' '}
                  {new Date(device.session_begin).toDateString()}
                </label>
                <Button
                  variant='millgreen'
                  onClick={() => logout(device.session_key)}
                  w='full'
                >
                  {content.navbar.logout}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    </>
  );
};

export default Logout;
