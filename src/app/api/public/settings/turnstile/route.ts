import { NextRequest, NextResponse } from 'next/server';
import { getTurnstileSettings } from '@/queries/settings';
import { json } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const settings = await getTurnstileSettings();

    // 只返回前端需要的配置
    return json({
      enabled: settings.enabled,
      siteKey: settings.enabled ? settings.siteKey : null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
