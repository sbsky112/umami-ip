'use client';

import { useState, useEffect } from 'react';
import { Button, Form, FormInput, FormRow, FormButtons, Switch, TextField } from 'react-basics';
import { useApi, useLogin, useMessages } from '@/components/hooks';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const { formatMessage, labels } = useMessages();
  const { user } = useLogin();
  const { post, get, useMutation } = useApi();
  const router = useRouter();
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
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
        turnstileEnabled: turnstileEnabled.toString(),
        turnstileSiteKey,
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
        <FormRow label="Enable Turnstile">
          <Switch checked={turnstileEnabled} onChange={checked => setTurnstileEnabled(checked)} />
        </FormRow>
        {turnstileEnabled && (
          <FormRow label="Turnstile Site Key">
            <FormInput name="turnstileSiteKey" value={turnstileSiteKey}>
              <TextField
                onChange={e => setTurnstileSiteKey(e.target.value)}
                placeholder="Enter your Turnstile site key"
              />
            </FormInput>
          </FormRow>
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
