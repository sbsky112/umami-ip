import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get settings from database
    const turnstileEnabled = await prisma.setting.findUnique({
      where: { key: 'turnstile_enabled' },
    });

    const turnstileSiteKey = await prisma.setting.findUnique({
      where: { key: 'turnstile_site_key' },
    });

    const turnstileSecretKey = await prisma.setting.findUnique({
      where: { key: 'turnstile_secret_key' },
    });

    return NextResponse.json({
      turnstileEnabled: turnstileEnabled?.value || 'false',
      turnstileSiteKey: turnstileSiteKey?.value || '',
      turnstileSecretKey: turnstileSecretKey?.value || '',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Save settings to database
    await prisma.setting.upsert({
      where: { key: 'turnstile_enabled' },
      update: { value: body.turnstileEnabled },
      create: {
        id: crypto.randomUUID(),
        key: 'turnstile_enabled',
        value: body.turnstileEnabled,
      },
    });

    await prisma.setting.upsert({
      where: { key: 'turnstile_site_key' },
      update: { value: body.turnstileSiteKey },
      create: {
        id: crypto.randomUUID(),
        key: 'turnstile_site_key',
        value: body.turnstileSiteKey,
      },
    });

    if (body.turnstileSecretKey !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'turnstile_secret_key' },
        update: { value: body.turnstileSecretKey },
        create: {
          id: crypto.randomUUID(),
          key: 'turnstile_secret_key',
          value: body.turnstileSecretKey,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
