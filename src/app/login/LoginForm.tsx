import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  PasswordField,
  SubmitButton,
  Icon,
} from 'react-basics';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useApi, useMessages } from '@/components/hooks';
import { setUser } from '@/store/app';
import { setClientAuthToken } from '@/lib/client';
import Logo from '@/assets/logo.svg';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const { formatMessage, labels, getMessage } = useMessages();
  const router = useRouter();
  const { post, useMutation } = useApi();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/login', data),
  });

  useEffect(() => {
    // Fetch config to check if Turnstile is enabled
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        setTurnstileEnabled(config.turnstileEnabled);
        setTurnstileSiteKey(config.turnstileSiteKey || '');
      })
      .catch(() => {
        // Silently handle error
      });
  }, []);

  const handleSubmit = async (data: any) => {
    if (turnstileEnabled && turnstileSiteKey && !turnstileToken) {
      setTurnstileError('Please complete the verification');
      return;
    }

    const loginData = turnstileEnabled && turnstileSiteKey ? { ...data, turnstileToken } : data;

    mutate(loginData, {
      onSuccess: async ({ token, user }) => {
        setClientAuthToken(token);
        setUser(user);

        router.push('/dashboard');
      },
      onError: () => {
        // Reset turnstile on error
        if (turnstileEnabled && turnstileSiteKey) {
          setTurnstileToken(null);
        }
        // The error message will be displayed by the Form component
        // through the error prop we're passing
      },
    });
  };

  return (
    <div className={styles.login}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>umami</div>
      <Form className={styles.form} onSubmit={handleSubmit} error={getMessage(error)}>
        <FormRow label={formatMessage(labels.username)}>
          <FormInput
            data-test="input-username"
            name="username"
            rules={{ required: formatMessage(labels.required) }}
          >
            <TextField autoComplete="off" />
          </FormInput>
        </FormRow>
        <FormRow label={formatMessage(labels.password)}>
          <FormInput
            data-test="input-password"
            name="password"
            rules={{ required: formatMessage(labels.required) }}
          >
            <PasswordField />
          </FormInput>
        </FormRow>
        {turnstileEnabled && turnstileSiteKey && (
          <FormRow>
            <div className={styles.turnstile}>
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={token => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onError={() => {
                  setTurnstileToken(null);
                  setTurnstileError('Verification failed. Please try again.');
                }}
                onExpire={() => {
                  setTurnstileToken(null);
                  setTurnstileError('Verification expired. Please complete again.');
                }}
                scriptOptions={{
                  onLoad: () => {
                    // Script loaded
                  },
                  onError: () => {
                    // Script error
                  },
                }}
              />
              {turnstileError && <div className={styles.turnstileError}>{turnstileError}</div>}
            </div>
          </FormRow>
        )}
        <FormButtons>
          <SubmitButton
            data-test="button-submit"
            className={styles.button}
            variant="primary"
            disabled={isPending || (turnstileEnabled && turnstileSiteKey && !turnstileToken)}
          >
            {formatMessage(labels.login)}
          </SubmitButton>
        </FormButtons>
      </Form>
    </div>
  );
}

export default LoginForm;
