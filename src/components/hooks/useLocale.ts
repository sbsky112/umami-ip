'use client';
import { useEffect } from 'react';
import { httpGet } from '@/lib/fetch';
import { setItem } from '@/lib/storage';
import { LOCALE_CONFIG } from '@/lib/constants';
import { getDateLocale, getTextDirection } from '@/lib/lang';
import useStore, { setLocale } from '@/store/app';
import { useForceUpdate } from './useForceUpdate';
import enUS from '../../../public/intl/country/en-US.json';

const messages = {
  'en-US': enUS,
};

const selector = (state: { locale: any }) => state.locale;

export function useLocale() {
  const locale = useStore(selector);
  const forceUpdate = useForceUpdate();
  const dir = getTextDirection(locale);
  const dateLocale = getDateLocale(locale);

  async function loadMessages(locale: string) {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const { data } = await httpGet(`${process.env.basePath || ''}/intl/messages/${locale}.json?t=${timestamp}`);

    messages[locale] = data;
  }

  async function saveLocale(value: string) {
    // Always reload messages to ensure latest translations
    await loadMessages(value);

    setItem(LOCALE_CONFIG, value);

    if (typeof document !== 'undefined') {
      document.getElementById('__next')?.setAttribute('dir', getTextDirection(value));
    }

    if (locale !== value) {
      setLocale(value);
    } else {
      forceUpdate();
    }
  }

  useEffect(() => {
    if (!messages[locale]) {
      saveLocale(locale);
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const locale = url.searchParams.get('locale');

      if (locale) {
        saveLocale(locale);
      }
    }
  }, []);

  return { locale, saveLocale, messages, dir, dateLocale };
}

export default useLocale;
