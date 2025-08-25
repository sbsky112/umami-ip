'use client';

import { ReactNode } from 'react';
import { useLogin, useMessages } from '@/components/hooks';
import MenuLayout from '@/components/layout/MenuLayout';
import TurnstileSettings from './TurnstileSettings';
import styles from './page.module.css';

export default function GlobalSettingsPage() {
  const { user } = useLogin();
  const { formatMessage, labels } = useMessages();

  const items = [
    {
      key: 'turnstile',
      label: formatMessage(labels.turnstile),
      url: '/settings/global',
    },
  ].filter(n => n);

  return (
    <MenuLayout items={items}>
      <div className={styles.container}>
        <h1>{formatMessage(labels.turnstile)}</h1>
        <TurnstileSettings />
      </div>
    </MenuLayout>
  );
}
