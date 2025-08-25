'use client';

import { Form, FormRow, FormInput, FormButtons, TextField, SubmitButton } from 'react-basics';
import { Switch } from '@/components/Switch';
import { useApi, useMessages } from '@/components/hooks';
import { useState, useEffect } from 'react';
import { useToasts } from 'react-basics';

interface ITurnstileSettings {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
}

export default function TurnstileSettings() {
  const { formatMessage, labels, messages } = useMessages();
  const { get, post, useQuery, useMutation } = useApi();
  const { showToast } = useToasts();
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSiteKey(settings.siteKey || '');
      setSecretKey(settings.secretKey || '');
    }
  }, [settings]);

  const handleSubmit = async (data: any) => {
    setSaveStatus('saving');
    
    mutate(
      {
        enabled: enabled,
        siteKey: enabled ? siteKey : '',
        secretKey: enabled ? secretKey : '',
      },
      {
        onSuccess: () => {
          showToast({ message: formatMessage(messages.saved), variant: 'success' });
          setSaveStatus('success');
          // 2秒后重置状态
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: (error: any) => {
          showToast({ 
            message: error?.message || formatMessage(messages.error), 
            variant: 'error' 
          });
          setSaveStatus('error');
          // 2秒后重置状态
          setTimeout(() => setSaveStatus('idle'), 2000);
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
        <SubmitButton variant="primary" disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving...' : formatMessage(labels.save)}
          {saveStatus === 'success' && ' ✓'}
          {saveStatus === 'error' && ' ✗'}
        </SubmitButton>
      </FormButtons>
    </Form>
  );
}
