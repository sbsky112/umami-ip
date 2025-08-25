import prisma from '@/lib/prisma';

export interface Setting {
  id: string;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TurnstileSettings {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
}

export async function getSetting(key: string): Promise<Setting | null> {
  return prisma.client.setting.findUnique({
    where: { key },
  });
}

export async function getSettings(): Promise<Setting[]> {
  return prisma.client.setting.findMany();
}

export async function getTurnstileSettings(): Promise<TurnstileSettings> {
  const setting = await getSetting('turnstile');

  if (!setting?.value) {
    return {
      enabled: false,
      siteKey: '',
      secretKey: '',
    };
  }

  return setting.value as TurnstileSettings;
}

export async function updateSetting(key: string, value: any): Promise<Setting> {
  return prisma.client.setting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: {
      id: crypto.randomUUID(),
      key,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function updateTurnstileSettings(settings: TurnstileSettings): Promise<Setting> {
  return updateSetting('turnstile', settings);
}
