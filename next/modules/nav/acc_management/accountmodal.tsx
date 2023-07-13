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
  defineStyle,
} from '@chakra-ui/react';
import { Formik, Field } from 'formik';
import { useRouter } from 'next/router';
import { setCookie, getCookie } from 'cookies-next';
import apiBaseUrl from '../../../lib/apiBaseURL';
import Login from './login';
import SignUp from './signup';
import Logout from './logout';
import localeContent from '../../../locales/locale.json';

export default function AccountModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const [body, setBody] = useState(0);
  const [title, setTitle] = useState(content.navbar.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const changePage = () => {
    setTitle(
      title === content.navbar.login
        ? content.navbar.signup
        : content.navbar.login
    );
    setBody(body === 0 ? 1 : 0);
  };
  const logout = (em, pa) => {
    setEmail(em);
    setPassword(pa);
    setTitle(content.navbar.tomanydev);
    setBody(2);
  };
  const bodies = [
    <Login
      changePage={changePage}
      onClose={onClose}
      logout={logout}
    />,
    <SignUp
      changePage={changePage}
      onClose={onClose}
    />,
    <Logout
      email={email}
      password={password}
    />,
  ];
  return (
    <>
      <Button
        variant='millgreenoutline'
        onClick={() => {
          setTitle(content.navbar.login);
          setBody(0);
          onOpen();
        }}
      >
        {content.navbar.login}
      </Button>
      <Button
        variant='millgreen'
        onClick={() => {
          setTitle(content.navbar.signup);
          setBody(1);
          onOpen();
        }}
      >
        {content.navbar.signup}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{bodies[body]}</ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
