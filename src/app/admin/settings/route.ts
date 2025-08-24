import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  if (!(await auth.isAdmin())) {
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

    return NextResponse.json({
      turnstileEnabled: turnstileEnabled?.value || 'false',
      turnstileSiteKey: turnstileSiteKey?.value || '',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await auth.isAdmin())) {
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
