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

  // Parse JSON string if it's a string
  return typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
}

export async function updateSetting(key: string, value: any): Promise<Setting> {
  // Convert value to JSON string if it's an object
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
  
  return prisma.client.setting.upsert({
    where: { key },
    update: { value: stringValue, updatedAt: new Date() },
    create: {
      id: crypto.randomUUID(),
      key,
      value: stringValue,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function updateTurnstileSettings(settings: TurnstileSettings): Promise<Setting> {
  return updateSetting('turnstile', settings);
}
