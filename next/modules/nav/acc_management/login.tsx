import Head from 'next/head';
import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Link,
  useDisclosure,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  CloseButton,
  useToast,
} from '@chakra-ui/react';
import { Formik, Field } from 'formik';
import { useRouter } from 'next/router';
import { setCookie, getCookie } from 'cookies-next';
import apiBaseUrl from '../../../lib/apiBaseURL';
import localeContent from '../../../locales/locale.json';

const Login = ({ changePage, onClose, logout }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const onSubmit = (values) => {
    setLoading(true);
    if (values.email && values.password) {
      fetch(
        `${apiBaseUrl}/login?email=${values.email}&password=${values.password}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setCookie('session_key', data.session_key);
            toast({
              title: content.navbar.statuses.loggedin,
              description: content.navbar.statuses.successlogin,
              status: 'success',
              duration: 9000,
              isClosable: true,
            });
            router.reload();
            onClose();
          } else if (
            data.error === 'Already logged in on three other devices'
          ) {
            logout(values.email, values.password);
          } else {
            toast({
              title: content.navbar.statuses.failed,
              description: data.error,
              status: 'error',
              duration: 9000,
              isClosable: true,
            });
            setLoading(false);
          }
        });
    } else {
      toast({
        title: content.navbar.statuses.failed,
        description: content.navbar.statuses.allfields,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Formik
      initialValues={{ email: '', username: '', password: '' }}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, errors, touched }) => (
        <form onSubmit={handleSubmit}>
          <VStack
            spacing={4}
            align='flex-start'
          >
            <FormControl
              isInvalid={(!!errors.email && touched.email) as boolean}
            >
              <label htmlFor='email'>{content.navbar.email}</label>
              <Field
                as={Input}
                id='email'
                name='email'
                type='email'
                placeholder={content.navbar.email}
                variant='millgreen'
                validate={(value) => {
                  let err;

                  const emailRegex = new RegExp(
                    '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$'
                  );
                  if (!emailRegex.test(value) && value != '') {
                    err = content.navbar.statuses.invalidemail;
                  }
                  return err;
                }}
              />
              <FormErrorMessage>{errors.email as string}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <label htmlFor='password'>{content.navbar.password}</label>
              <Field
                as={Input}
                id='password'
                name='password'
                type='password'
                variant='millgreen'
                placeholder={content.navbar.password}
              />
            </FormControl>
            <HStack
              width='full'
              justify='center'
            >
              <p>{content.navbar.havenoaccount}</p>
              <Link
                color='millgreen.500'
                onClick={changePage}
              >
                {content.navbar.signup}
              </Link>
            </HStack>
            <Button
              type='submit'
              variant='millgreen'
              width='full'
            >
              {content.navbar.login}
            </Button>
          </VStack>
        </form>
      )}
    </Formik>
  );
};

export default Login;
