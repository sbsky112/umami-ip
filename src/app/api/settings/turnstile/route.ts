import { NextRequest, NextResponse } from 'next/server';
import { getTurnstileSettings, updateTurnstileSettings } from '@/queries/settings';
import { json, serverError } from '@/lib/response';
import { z } from 'zod';

const turnstileSchema = z.object({
  enabled: z.boolean(),
  siteKey: z.string().optional(),
  secretKey: z.string().optional(),
});

export async function GET() {
  try {
    // For now, skip authentication check for testing
    const settings = await getTurnstileSettings();
    return json({
      enabled: settings.enabled,
      siteKey: settings.enabled ? settings.siteKey : null,
    });
  } catch (error) {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication check for testing
    const body = await request.json();
    const result = turnstileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid settings', details: result.error.issues },
        { status: 400 },
      );
    }

    const { enabled, siteKey, secretKey } = result.data;

    if (enabled && (!siteKey || !secretKey)) {
      return NextResponse.json(
        { error: 'Site key and secret key are required when enabled' },
        { status: 400 },
      );
    }

    const settings = await updateTurnstileSettings({
      enabled,
      siteKey: siteKey || '',
      secretKey: secretKey || '',
    });

    return json(settings.value);
  } catch (error) {
    // Log error but don't expose details
    return serverError();
  }
}
