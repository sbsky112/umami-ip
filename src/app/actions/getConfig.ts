'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type Config = {
  faviconUrl: string | undefined;
  privateMode: boolean;
  telemetryDisabled: boolean;
  trackerScriptName: string | undefined;
  updatesDisabled: boolean;
  turnstileEnabled: boolean;
  turnstileSiteKey: string | undefined;
};

export async function getConfig(): Promise<Config> {
  // Get Turnstile settings from database
  let turnstileEnabled = !!process.env.TURNSTILE_ENABLED;
  let turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  try {
    // Only try to read from database if we have a DATABASE_URL
    if (process.env.DATABASE_URL) {
      const setting = await prisma.setting.findUnique({
        where: { key: 'turnstile_enabled' },
      });

      if (setting !== null) {
        turnstileEnabled = setting.value === 'true';
      }

      const siteKeySetting = await prisma.setting.findUnique({
        where: { key: 'turnstile_site_key' },
      });

      if (siteKeySetting !== null && siteKeySetting.value) {
        turnstileSiteKey = siteKeySetting.value;
      }
    }
  } catch {
    // If database is not available, fall back to environment variables
  }

  return {
    faviconUrl: process.env.FAVICON_URL,
    privateMode: !!process.env.PRIVATE_MODE,
    telemetryDisabled: !!process.env.DISABLE_TELEMETRY,
    trackerScriptName: process.env.TRACKER_SCRIPT_NAME,
    updatesDisabled: !!process.env.DISABLE_UPDATES,
    turnstileEnabled,
    turnstileSiteKey,
  };
}
