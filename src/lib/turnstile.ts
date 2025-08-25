import { getTurnstileSettings } from '@/queries/settings';

interface TurnstileVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  try {
    const settings = await getTurnstileSettings();

    if (!settings.enabled) {
      return true;
    }

    if (!settings.secretKey) {
      throw new Error('Turnstile secret key is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('secret', settings.secretKey);
    formData.append('response', token);

    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data: TurnstileVerificationResponse = await response.json();

    if (!data.success) {
      // console.error('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    // console.error('Turnstile verification error:', error);
    return false;
  }
}
