import {
  Button,
  FormControl,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  useDisclosure,
  useToast,
  VStack,
  useColorModeValue,
  Flex,
  Square,
  Center,
  Spinner,
  FormErrorMessage,
} from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { use, useContext, useEffect, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { FiUpload } from 'react-icons/fi';
import apiBaseUrl from '../../lib/apiBaseURL';
import { UserContext } from '../../lib/userContext';
import Flag from 'react-world-flags';
import {
  Select,
  chakraComponents,
  OptionProps,
  GroupBase,
  MultiValue,
} from 'chakra-react-select';
import localeContent from '../../locales/locale.json';

const EditButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Array<CountryOption>>(null);
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/countries`)
      .then((res) => res.json())
      .then((data) => {
        const countries: Array<CountryOption> = data.map((country) => {
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
        });
        setCountries(countries);
        setIsLoading(false);
      });
  }, []);
  const [avatar, setAvatar] = useState(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const userData = useContext(UserContext);
  const toast = useToast();
  const router = useRouter();
  const usernameRegex =
    /^(?=.{1,15}$)(?![_.])(?!.*[_.]{2})[\p{Letter}0-9._]+(?<![_.])$/u;
  const usernameError = !usernameRegex.test(username) && username.length > 0;
  const emailRegex = new RegExp(
    '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$'
  );
  const emailError = !emailRegex.test(email) && email.length > 0;
  const editImage = () => {
    // check if avatar is blob
    if (!avatar) return;
    // scale avatar down to 250x250 pixels
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result as string;
      img.onload = async () => {
        const elem = document.createElement('canvas');
        elem.width = 150;
        elem.height = 150;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, 150, 150);
        const dataUrl = elem.toDataURL('image/png');
        const res = await fetch(`${apiBaseUrl}/account/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: dataUrl,
            session_key: getCookie('session_key'),
          }),
        });
        const data: ApiResponse = await res.json();
        if (data.status == 'success') {
          toast({
            title: 'Avatar updated.',
            description: 'Your avatar has been updated.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          router.reload();
        } else if (data.status == 'error') {
          toast({
            title: 'Avatar update failed.',
            description: data.error,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        return data;
      };
    };
    reader.readAsDataURL(avatar);
  };
  const editEmail = async () => {
    if (!email) return;
    if (email === userData.email) return;
    // send request to api
    const res = await fetch(`${apiBaseUrl}/account/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        session_key: getCookie('session_key'),
      }),
    });
    let data: ApiResponse = await res.json();
    if (data.status == 'success') {
      toast({
        title: 'Email updated.',
        description: 'Your email has been updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else if (data.status == 'error') {
      toast({
        title: 'Email update failed.',
        description: data.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    return data;
  };
  const editUsername = async () => {
    if (!username) return;
    if (username === userData.username) return;
    // send request to api
    const res = await fetch(`${apiBaseUrl}/account/username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        session_key: getCookie('session_key'),
      }),
    });
    const data: ApiResponse = await res.json();
    if (data.status == 'success') {
      toast({
        title: 'Username updated.',
        description: 'Your username has been updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else if (data.status == 'error') {
      toast({
        title: 'Username update failed.',
        description: data.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    return data;
  };
  const editCountry = async () => {
    if (!country) return;
    if (country === userData.country) return;
    // send request to api
    const res = await fetch(`${apiBaseUrl}/account/country`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country,
        session_key: getCookie('session_key'),
      }),
    });
    const data: ApiResponse = await res.json();
    if (data.status == 'success') {
      toast({
        title: 'Country updated.',
        description: 'Your country has been updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else if (data.status == 'error') {
      toast({
        title: 'Country update failed.',
        description: data.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    return data;
  };
  if (isLoading) {
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
    <>
      <Button
        onClick={onOpen}
        gap={2}
      >
        <FaRegEdit /> {content.account.edit}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{content.account.editModal.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <VStack
                align='flex-start'
                spacing={2}
              >
                <label htmlFor='avatar'>
                  {content.account.editModal.picture}
                </label>
                <Input
                  id='avatar'
                  accept='image/*'
                  type='file'
                  onChange={(e) => {
                    setAvatar(e.target.files[0]);
                  }}
                />
                {/* FormControl for Email with current email as placeholder */}
                <FormControl isInvalid={emailError}>
                  <label htmlFor='email'>
                    {content.account.editModal.email}
                  </label>
                  <Input
                    id='email'
                    type='email'
                    variant='millgreen'
                    placeholder={userData.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                  />
                  {emailError && (
                    <FormErrorMessage>
                      {content.account.editModal.emailerror}
                    </FormErrorMessage>
                  )}
                </FormControl>
                {/* FormControl for Username with current username as placeholder */}
                <FormControl isInvalid={usernameError}>
                  <label htmlFor='username'>
                    {content.account.editModal.username}
                  </label>
                  <Input
                    id='username'
                    type='text'
                    variant='millgreen'
                    placeholder={userData.username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                    }}
                  />
                  {usernameError && (
                    <FormErrorMessage>
                      {content.account.editModal.usernameerror}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl>
                  <label htmlFor='country'>
                    {content.account.editModal.country}
                  </label>
                  <Select<CountryOption, true, GroupBase<CountryOption>>
                    id='country'
                    name='country'
                    options={countries}
                    onChange={(option) => {
                      setCountry((option as unknown as CountryOption).value);
                    }}
                    components={customComponents}
                    placeholder={
                      countries.find(
                        (country) => country.value === userData.country_code
                      )?.label
                    }
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
                          bg: useColorModeValue(
                            'millgreen.100',
                            'millgreen.500'
                          ),
                        },
                        color: useColorModeValue('black', 'white'),
                      }),
                    }}
                  />
                </FormControl>
              </VStack>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              w='full'
              variant='millgreen'
              disabled={usernameError || emailError}
              onClick={async () => {
                let emailResponse;
                if (email) {
                  emailResponse = await editEmail();
                }
                let usernameResponse;
                if (username) {
                  usernameResponse = await editUsername();
                }
                let countryResponse;
                if (country) {
                  countryResponse = await editCountry();
                }
                if (avatar) {
                  editImage();
                }
                if (
                  [emailResponse, usernameResponse, countryResponse].some(
                    (a) => a?.status == 'success'
                  )
                ) {
                  onClose();
                  router.reload();
                }
              }}
            >
              {content.account.editModal.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditButton;

const customComponents = {
  Option: ({
    children,
    ...props
  }: OptionProps<CountryOption, true, GroupBase<CountryOption>>) => {
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

interface ApiResponse {
  status: string;
  error?: string;
}
