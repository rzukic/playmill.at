import Head from 'next/head';
import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Square,
  useDisclosure,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Flex,
  Center,
  VStack,
  HStack,
  Link,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { Select, chakraComponents, OptionProps, GroupBase } from 'chakra-react-select';
import Flag from 'react-world-flags';
import { Formik, Field } from 'formik';
import useSWR from 'swr';
import apiBaseUrl from '../../../lib/apiBaseURL';
import { useRouter } from 'next/router';
import localeContent from '../../../locales/locale.json';
import { setCookie } from 'cookies-next';

const customComponents = {
  Option: ({ children, ...props }: OptionProps<CountryOption, true, GroupBase<CountryOption>>) => {
    return (
      <chakraComponents.Option {...props}>
        <Flex gap='2'>
          <Square>{props.data.icon}</Square>
          <Center>{children}</Center>
        </Flex>
      </chakraComponents.Option>
    );
  },
};

interface CountryOption {
  value: string;
  label: string;
  icon: JSX.Element;
}

const SignUp = ({ changePage, onClose }) => {
  const [countries, setCountries] = useState<CountryOption>(null);
  const [loading, setLoading] = useState(false);
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const toast = useToast();
  const router = useRouter();
  const onSubmit = (values) => {
    setLoading(true);
    if (values.email && values.username && values.password && values.country) {
      const data = {
        email: values.email,
        username: values.username,
        password: values.password,
        country: values.country,
      };
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      };
      fetch(`${apiBaseUrl}/account`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          if (data.status == 'success') {
            fetch(`${apiBaseUrl}/login?email=${values.email}&password=${values.password}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.status == 'success') {
                  toast({
                    title: content.navbar.statuses.success,
                    description: content.navbar.statuses.registered,
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                  });
                  setCookie('session_key', data.session_key);
                  router.push('/account', '/account', { locale });
                  router.reload();
                }
              });
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

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBaseUrl}/countries`)
      .then((res) => res.json())
      .then((data) => {
        setCountries(
          data.map((country) => {
            return {
              value: country.country_code,
              label: country.country_name,
              icon: (
                <Flag
                  code={country.country_code}
                  width='20'
                />
              ),
            };
          })
        );
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!countries) {
    return (
      <Center>
        <p>There was an error loading the countries.</p>
      </Center>
    );
  }

  return (
    <Formik
      initialValues={{
        email: '',
        username: '',
        password: '',
        passwordconfirm: '',
        country: '',
        countrydisplay: null,
      }}
      onSubmit={onSubmit}>
      {({ handleSubmit, errors, touched, values, setFieldValue }) => (
        <form onSubmit={handleSubmit}>
          <VStack
            spacing={4}
            align='flex-start'>
            <FormControl isInvalid={(!!errors.email && touched.email) as boolean}>
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
                  const emailRegex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$');
                  if (!emailRegex.test(value) && value != '') {
                    err = content.navbar.statuses.invalidemail;
                  }
                  return err;
                }}
              />
              <FormErrorMessage>{errors.email as string}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={(!!errors.username && touched.username) as boolean}>
              <label htmlFor='username'>{content.navbar.username}</label>
              <Field
                as={Input}
                id='username'
                name='username'
                type='text'
                placeholder={content.navbar.username}
                variant='millgreen'
                validate={(value) => {
                  let err;
                  if (value) {
                    const usernameRegex = /^(?=.{1,15}$)(?![_.])(?!.*[_.]{2})[\p{Letter}0-9._]+(?<![_.])$/u;
                    if (!usernameRegex.test(value)) {
                      err = content.navbar.statuses.invalidusername;
                    }
                  }
                  return err;
                }}
              />
              <FormErrorMessage>{errors.username as string}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={(!!errors.password && touched.password) as boolean}>
              <label htmlFor='password'>{content.navbar.password}</label>
              <Field
                as={Input}
                id='password'
                name='password'
                type='password'
                placeholder={content.navbar.password}
                variant='millgreen'
                validate={(value) => {
                  let err;
                  if (!value) return err;
                  if (value.length < 8) {
                    err = content.navbar.statuses.passwordshort;
                  } else if (value.includes(' ')) {
                    err = content.navbar.statuses.passwordspaces;
                  } else if (!value.match(/[a-z]/)) {
                    err = content.navbar.statuses.passwordlowercase;
                  } else if (!value.match(/[A-Z]/)) {
                    err = content.navbar.statuses.passworduppercase;
                  } else if (!value.match(/[0-9]/)) {
                    err = content.navbar.statuses.passwordnumber;
                  }
                  return err;
                }}
              />
              <FormErrorMessage>{errors.password as string}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={(!!errors.passwordconfirm && touched.passwordconfirm) as boolean}>
              <label htmlFor='password'>{content.navbar.confpassword}</label>
              <Field
                as={Input}
                id='passwordconfirm'
                name='passwordconfirm'
                type='password'
                placeholder={content.navbar.confpassword}
                variant='millgreen'
                validate={(value) => {
                  let err;
                  if (value != values.password) {
                    err = content.navbar.statuses.passwordmatch;
                  }
                  return err;
                }}
              />
              <FormErrorMessage>{errors.passwordconfirm as string}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={false}>
              <label htmlFor='countrydisplay'>{content.navbar.country}</label>
              <Field
                as={Select}
                id='countrydisplay'
                name='countrydisplay'
                type='select'
                options={countries}
                onChange={(option) => {
                  setFieldValue('country', option.value);
                  setFieldValue('countrydisplay', option);
                }}
                components={customComponents}
                placeholder={content.navbar.country}
                variant='filled'
                chakraStyles={{
                  dropdownIndicator: (provided) => ({
                    ...provided,
                    bg: 'transparent',
                  }),
                  control: (provided) => ({
                    ...provided,
                    _focus: {
                      borderColor: 'millgreen.500',
                    },
                  }),
                  menuList: (provided) => ({
                    ...provided,
                    bg: useColorModeValue('white', 'millgrey.300'),
                  }),
                  option: (provided) => ({
                    ...provided,
                    bg: useColorModeValue('white', 'millgrey.300'),
                    _hover: {
                      bg: useColorModeValue('millgreen.100', 'millgreen.500'),
                    },
                    color: useColorModeValue('black', 'white'),
                  }),
                }}
              />
            </FormControl>
            <HStack
              width='full'
              justify='center'>
              <p>{content.navbar.havenoaccount}</p>
              <Link
                color='millgreen.500'
                onClick={changePage}>
                {content.navbar.login}
              </Link>
            </HStack>
            <Button
              type='submit'
              variant='millgreen'
              width='full'>
              {content.navbar.signup}
            </Button>
          </VStack>
        </form>
      )}
    </Formik>
  );
};

export default SignUp;
