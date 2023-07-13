import {
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  VStack,
  ModalFooter,
  Input,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import apiBaseUrl from '../../lib/apiBaseURL';
import { UserContext } from '../../lib/userContext';
import localeContent from '../../locales/locale.json';

const PasswordChanger = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const toast = useToast();
  const userData = useContext(UserContext);
  const [password, setPassword] = useState('');
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const passwordError = !(
    (password.length >= 8 &&
      password.match(/[0-9]/) &&
      password.match(/[A-Z]/) &&
      password.match(/[a-z]/) &&
      !password.includes(' ')) ||
    password === ''
  );
  const passwordErrorMessage =
    password.length >= 8
      ? password.match(/[0-9]/)
        ? password.match(/[A-Z]/)
          ? password.match(/[a-z]/)
            ? !password.includes(' ')
              ? 'Unknown error'
              : content.account.changepwdModal.passwordspaces
            : content.account.changepwdModal.passwordlowercase
          : content.account.changepwdModal.passworduppercase
        : content.account.changepwdModal.passwordnumber
      : content.account.changepwdModal.passwordshort;
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const passwordConfirmError =
    passwordConfirm !== password && passwordConfirm !== '';
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);

  return (
    <>
      <Button
        onClick={onOpen}
        gap={2}
      >
        {content.account.changepwd}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{content.account.changepwdModal.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={passwordError}>
              <label htmlFor='password'>
                {content.account.changepwdModal.newpwd}
              </label>
              <Input
                id='password'
                type='password'
                variant='millgreen'
                value={password}
                onClick={() => {
                  !passwordTouched && setPasswordTouched(true);
                }}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
              {passwordError && passwordTouched && (
                <FormErrorMessage>{passwordErrorMessage}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={passwordConfirmError}>
              <label htmlFor='passwordconfirm'>
                {content.account.changepwdModal.confpwd}
              </label>
              <Input
                id='passwordconfirm'
                type='password'
                variant='millgreen'
                value={passwordConfirm}
                onClick={() => {
                  !passwordConfirmTouched && setPasswordConfirmTouched(true);
                }}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                }}
              />
              {passwordConfirmError && passwordConfirmTouched && (
                <FormErrorMessage>
                  {content.account.changepwdModal.passwordmatch}
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl>
              <label htmlFor='passwordold'>
                {content.account.changepwdModal.oldpwd}
              </label>
              <Input
                id='passwordold'
                type='password'
                variant='millgreen'
                value={passwordOld}
                onChange={(e) => {
                  setPasswordOld(e.target.value);
                }}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              w='full'
              onClick={() => {
                if (!(password && passwordConfirm && passwordOld)) return;
                if (passwordError || passwordConfirmError) return;
                fetch(`${apiBaseUrl}/account/password`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: userData.email,
                    oldPassword: passwordOld,
                    newPassword: password,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.status === 'success') {
                      onClose();
                      router.reload();
                    } else if (data.status === 'error') {
                      toast({
                        title: 'Error',
                        description: data.error,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  });
              }}
            >
              {content.account.changepwdModal.change}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PasswordChanger;
