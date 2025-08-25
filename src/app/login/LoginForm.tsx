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
import { useTurnstileSettings } from '@/components/hooks/useTurnstileSettings';
import { setUser } from '@/store/app';
import { setClientAuthToken } from '@/lib/client';
import { Turnstile } from '@/components/Turnstile';
import Logo from '@/assets/logo.svg';
import styles from './LoginForm.module.css';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    turnstileSuccessCallback?: (token: string) => void;
    turnstileExpiredCallback?: () => void;
    turnstileErrorCallback?: () => void;
  }
}

export function LoginForm() {
  const { formatMessage, labels, getMessage } = useMessages();
  const router = useRouter();
  const { post, useMutation } = useApi();
<<<<<<< HEAD
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');

=======
  const { settings: turnstileSettings, isLoading: isTurnstileLoading } = useTurnstileSettings();
>>>>>>> dev
  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/login', data),
  });

<<<<<<< HEAD
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
=======
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(false);
  const [shouldRenderTurnstile, setShouldRenderTurnstile] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  // Reset Turnstile state when form data changes after error
  useEffect(() => {
    // Only reset if there was a non-CAPTCHA error and user starts typing
    if (turnstileSettings.enabled && loginAttempted && !isPending && error && !turnstileError) {
      // We'll use a timeout to detect when user stops typing
      const timeoutId = setTimeout(() => {
        setShouldRenderTurnstile(false);
        setTurnstileError(null);
        setAutoSubmit(false);
        setLoginAttempted(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [error, loginAttempted, turnstileToken, isPending, turnstileSettings.enabled, turnstileError]);

  // Handle auto-submit after Turnstile verification
  useEffect(() => {
    if (autoSubmit && turnstileToken) {
      // Get form data and submit
      const form = document.querySelector('form');
      if (form) {
        const formData = new FormData(form);
        const data = {
          username: formData.get('username'),
          password: formData.get('password'),
        };
        handleSubmit(data, undefined, true);
        setAutoSubmit(false);
      }
    }
  }, [autoSubmit, turnstileToken]);

  // Set up global callbacks for implicit rendering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.turnstileSuccessCallback = (token: string) => {
        console.log('Turnstile verified:', token);
        setTurnstileToken(token);
        setTurnstileError(null);
      };

      window.turnstileExpiredCallback = () => {
        console.log('Turnstile expired');
        setTurnstileToken(null);
        setTurnstileError('CAPTCHA expired. Please complete verification again.');
      };

      window.turnstileErrorCallback = () => {
        console.log('Turnstile error');
        setTurnstileToken(null);
        setTurnstileError('CAPTCHA verification failed. Please try again.');
      };
    }

    return () => {
      // Clean up global callbacks
      if (typeof window !== 'undefined') {
        delete window.turnstileSuccessCallback;
        delete window.turnstileExpiredCallback;
        delete window.turnstileErrorCallback;
      }
    };
  }, []);

  const handleSubmit = async (data: any, event?: any, isAutoSubmit = false) => {
    // Prevent form submission if needed
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    
    // If this is an auto-submit, we don't need to set loginAttempted
    if (!isAutoSubmit) {
      setLoginAttempted(true);
    }
    
    // If Turnstile is enabled but not rendered yet, render it
    if (turnstileSettings.enabled && !shouldRenderTurnstile) {
      setShouldRenderTurnstile(true);
      setTurnstileError('Please complete the CAPTCHA verification');
      return false;
    }

    // If Turnstile is enabled but not verified yet
    if (turnstileSettings.enabled && !turnstileToken) {
      setTurnstileError('Please complete the CAPTCHA verification');
      return false;
    }

    const loginData = {
      ...data,
      ...(turnstileSettings.enabled && { turnstileToken }),
    };
>>>>>>> dev

    mutate(loginData, {
      onSuccess: async ({ token, user }) => {
        setClientAuthToken(token);
        setUser(user);
        router.push('/dashboard');
      },
<<<<<<< HEAD
      onError: () => {
        // Reset turnstile on error
        if (turnstileEnabled && turnstileSiteKey) {
          setTurnstileToken(null);
        }
        // The error message will be displayed by the Form component
        // through the error prop we're passing
=======
      onError: (error: any) => {
        if (error.message?.includes('CAPTCHA') || error.message?.includes('turnstile')) {
          setTurnstileError('CAPTCHA verification failed. Please try again.');
          // Reset Turnstile on verification failure
          setTurnstileToken(null);
          setTurnstileReset(prev => !prev);
          setShouldRenderTurnstile(true); // Keep it rendered for retry
        } else {
          setTurnstileError(null);
          // On other errors, reset Turnstile state but don't render
          setShouldRenderTurnstile(false);
          setLoginAttempted(false); // Reset login attempt on non-CAPTCHA errors
        }
>>>>>>> dev
      },
    });
    
    return true;
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setTurnstileError(null);
    // Trigger auto-submit
    setAutoSubmit(true);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setTurnstileError('CAPTCHA verification failed. Please try again.');
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setTurnstileError('CAPTCHA expired. Please complete verification again.');
  };

  const handleTurnstileLoadError = () => {
    setTurnstileError('Failed to load verification service. Please try again.');
    setShouldRenderTurnstile(false);
    setLoginAttempted(false);
  };

  return (
    <div className={styles.login}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>umami</div>
      <Form
        className={styles.form}
        onSubmit={handleSubmit}
        error={getMessage(error) || turnstileError}
      >
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
<<<<<<< HEAD
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
=======

        {!isTurnstileLoading && turnstileSettings.enabled && shouldRenderTurnstile && (
          <FormRow label={formatMessage(labels.turnstile)}>
            <div className={styles.turnstileContainer}>
              <Turnstile
                siteKey={turnstileSettings.siteKey!}
                onVerify={handleTurnstileVerify}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
                onLoadError={handleTurnstileLoadError}
                reset={turnstileReset}
                lazyRender={true}
                shouldRender={shouldRenderTurnstile}
              />
            </div>
          </FormRow>
        )}

>>>>>>> dev
        <FormButtons>
          <SubmitButton
            data-test="button-submit"
            className={styles.button}
            variant="primary"
<<<<<<< HEAD
            disabled={isPending || (turnstileEnabled && turnstileSiteKey && !turnstileToken)}
=======
            disabled={isPending || (turnstileSettings.enabled && loginAttempted && !turnstileToken)}
>>>>>>> dev
          >
            {formatMessage(labels.login)}
          </SubmitButton>
        </FormButtons>
      </Form>
    </div>
  );
}

export default LoginForm;
