'use client';

import { useState, useEffect } from 'react';
import { Button, Form, FormInput, FormRow, FormButtons, Toggle, TextField } from 'react-basics';
import { useApi, useLogin, useMessages } from '@/components/hooks';
import { useRouter } from 'next/navigation';
import styles from './AdminSettingsPage.module.css';

export default function AdminSettingsPage() {
  const { formatMessage, labels } = useMessages();
  const { user } = useLogin();
  const { post, get, useMutation } = useApi();
  const router = useRouter();
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
  const [loading, setLoading] = useState(true);

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/admin/settings', data),
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await get('/admin/settings');
        setTurnstileEnabled(res.turnstileEnabled === 'true');
        setTurnstileSiteKey(res.turnstileSiteKey || '');
        setTurnstileSecretKey(res.turnstileSecretKey || '');
      } catch {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      loadSettings();
    }
  }, [user, get]);

  const handleSubmit = async () => {
    mutate(
      {
        turnstileEnabled: Boolean(turnstileEnabled).toString(),
        turnstileSiteKey,
        turnstileSecretKey,
      },
      {
        onSuccess: () => {
          router.push('/settings');
        },
      },
    );
  };

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{formatMessage(labels.settings)}</h1>
      <Form onSubmit={handleSubmit} error={error}>
        <FormRow label={formatMessage(labels.enableTurnstile)}>
          <Toggle
            checked={turnstileEnabled}
            onChange={() => setTurnstileEnabled(!turnstileEnabled)}
          />
        </FormRow>
        {turnstileEnabled && (
          <div className={styles.description}>
            Cloudflare Turnstile helps protect your login page from bots and automated attacks. You
            need to sign up for a free account at cloudflare.com to get your site and secret keys.
          </div>
        )}
        {turnstileEnabled && (
          <>
            <FormRow label={formatMessage(labels.turnstileSiteKey)}>
              <FormInput name="turnstileSiteKey" value={turnstileSiteKey}>
                <TextField
                  value={turnstileSiteKey}
                  onChange={e => setTurnstileSiteKey(e.target.value)}
                  placeholder={formatMessage(labels.enterTurnstileSiteKey)}
                />
              </FormInput>
            </FormRow>
            <FormRow label={formatMessage(labels.turnstileSecretKey)}>
              <FormInput name="turnstileSecretKey" value={turnstileSecretKey}>
                <TextField
                  value={turnstileSecretKey}
                  type="password"
                  onChange={e => setTurnstileSecretKey(e.target.value)}
                  placeholder={formatMessage(labels.enterTurnstileSecretKey)}
                />
              </FormInput>
            </FormRow>
          </>
        )}
        <FormButtons>
          <Button type="submit" variant="primary" disabled={isPending}>
            {formatMessage(labels.save)}
          </Button>
        </FormButtons>
      </Form>
    </div>
  );
}
