'use client';

import { Form, FormRow, FormInput, FormButtons, TextField, SubmitButton } from 'react-basics';
import { Switch } from '@/components/Switch';
import { useApi, useMessages } from '@/components/hooks';
import { useState, useEffect } from 'react';

interface ITurnstileSettings {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
}

export default function TurnstileSettings() {
  const { formatMessage, labels } = useMessages();
  const { get, post, useQuery, useMutation } = useApi();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['turnstile-settings'],
    queryFn: () => get('/settings/turnstile'),
    initialData: { enabled: false, siteKey: '', secretKey: '' },
  });
  const { mutate, error, isPending, isSuccess } = useMutation({
    mutationFn: (data: TurnstileSettings) => post('/settings/turnstile', data),
  });

  const [enabled, setEnabled] = useState<boolean>(false);
  const [siteKey, setSiteKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSiteKey(settings.siteKey || '');
      setSecretKey(settings.secretKey || '');
    }
  }, [settings]);

  const handleSubmit = async (data: any) => {
    mutate(
      {
        enabled: enabled,
        siteKey: enabled ? siteKey : '',
        secretKey: enabled ? secretKey : '',
      },
      {
        onSuccess: () => {
          // Settings saved successfully
          console.log('Turnstile settings saved successfully');
        },
      },
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Form onSubmit={handleSubmit} error={error}>
      <FormRow label={formatMessage(labels.enable)}>
        <Switch
          checked={enabled}
          onChange={checked => {
            setEnabled(checked);
            if (!checked) {
              setSiteKey('');
              setSecretKey('');
            }
          }}
        />
      </FormRow>

      {enabled && (
        <>
          <FormRow label={formatMessage(labels.siteKey)}>
            <TextField
              name="siteKey"
              value={siteKey}
              onChange={e => setSiteKey(e.target.value)}
              placeholder={formatMessage(labels.siteKey)}
            />
          </FormRow>

          <FormRow label={formatMessage(labels.secretKey)}>
            <TextField
              name="secretKey"
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              placeholder={formatMessage(labels.secretKey)}
              type="password"
            />
          </FormRow>
        </>
      )}

      <FormButtons>
        <SubmitButton variant="primary" disabled={isPending}>
          {isPending ? 'Saving...' : formatMessage(labels.save)}
          {isSuccess && ' ✓'}
        </SubmitButton>
      </FormButtons>
    </Form>
  );
}
