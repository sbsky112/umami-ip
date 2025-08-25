import { z } from 'zod';
import { checkPassword } from '@/lib/auth';
import { createSecureToken } from '@/lib/jwt';
import redis from '@/lib/redis';
import { getUserByUsername } from '@/queries';
import { json, unauthorized, serverError } from '@/lib/response';
import { parseRequest } from '@/lib/request';
import { saveAuth } from '@/lib/auth';
import { secret } from '@/lib/crypto';
import { ROLES } from '@/lib/constants';
<<<<<<< HEAD
import { PrismaClient } from '@prisma/client';
=======
import { verifyTurnstileToken } from '@/lib/turnstile';
import { getTurnstileSettings } from '@/queries/settings';
>>>>>>> dev
import debug from 'debug';

const log = debug('umami:login');

async function verifyTurnstileToken(token: string, secretKey: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
  });

  const data = await response.json();
  return data;
}

export async function POST(request: Request) {
  const prisma = new PrismaClient();

  try {
    // Check required environment variables
    if (!process.env.DATABASE_URL) {
      log('DATABASE_URL environment variable is not set');
      return serverError('Database configuration error');
    }

    if (!process.env.APP_SECRET) {
      log('APP_SECRET environment variable is not set');
      return serverError('Application configuration error');
    }

    // Check Turnstile settings from database - default to disabled
    let turnstileSecretKey = null;
    let turnstileEnabled = false;

    try {
      const enabledSetting = await prisma.setting.findUnique({
        where: { key: 'turnstile_enabled' },
      });
      const secretSetting = await prisma.setting.findUnique({
        where: { key: 'turnstile_secret_key' },
      });

      turnstileEnabled = enabledSetting?.value === 'true';
      turnstileSecretKey = secretSetting?.value;
    } catch (error) {
      log('Error fetching Turnstile settings:', error);
    }

    // Create base schema
    const baseSchema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
      turnstileToken: z.string().optional(),
    });

    // Add turnstileToken conditionally
    const schema =
      turnstileEnabled && turnstileSecretKey
        ? baseSchema.extend({
            turnstileToken: z.string().min(1, 'Turnstile verification is required'),
          })
        : baseSchema;

    const { body, error } = await parseRequest(request, schema, { skipAuth: true });

    if (error) {
      return error();
    }

    const { username, password, turnstileToken } = body;

    log(`Login attempt for username: ${username}`);

<<<<<<< HEAD
    // Verify Turnstile token if enabled and secret key is configured
    if (turnstileEnabled && turnstileSecretKey && turnstileToken) {
      try {
        const verification = await verifyTurnstileToken(turnstileToken, turnstileSecretKey);
        if (!verification.success) {
          log(`Turnstile verification failed for user: ${username}`);
          return unauthorized('message.turnstile-verification-failed');
        }
      } catch (error) {
        log('Turnstile verification error:', error);
        return unauthorized('message.turnstile-verification-error');
=======
    // Verify Turnstile token if enabled
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check if Turnstile is enabled
    const settings = await getTurnstileSettings();

    if (settings.enabled) {
      if (!turnstileToken) {
        log(`Turnstile token missing for user: ${username}`);
        return unauthorized('CAPTCHA verification required');
      }

      const isValidTurnstile = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!isValidTurnstile) {
        log(`Turnstile verification failed for user: ${username}`);
        return unauthorized('CAPTCHA verification failed');
>>>>>>> dev
      }
    }

    // Check if database is accessible
    let user;
    try {
      user = await getUserByUsername(username, { includePassword: true });
    } catch (dbError) {
      log('Database error:', dbError);
      return serverError('Database connection error');
    }

    if (!user) {
      log(`User not found: ${username}`);
      return unauthorized('message.incorrect-username-password');
    }

    // Verify password
    let passwordValid;
    try {
      passwordValid = checkPassword(password, user.password);
    } catch (passwordError) {
      log('Password verification error:', passwordError);
      return serverError('Authentication error');
    }

    if (!passwordValid) {
      log(`Invalid password for user: ${username}`);
      return unauthorized('message.incorrect-username-password');
    }

    const { id, role, createdAt } = user;

    // Generate authentication token
    let token: string;
    try {
      if (redis.enabled) {
        token = await saveAuth({ userId: id, role });
      } else {
        if (!secret()) {
          log('APP_SECRET is not configured properly');
          return serverError('Token generation error');
        }
        token = createSecureToken({ userId: user.id, role }, secret());
      }
    } catch (tokenError) {
      log('Token generation error:', tokenError);
      return serverError('Token generation error');
    }

    log(`Successful login for user: ${username}`);

    return json({
      token,
      user: { id, username, role, createdAt, isAdmin: role === ROLES.admin },
    });
  } catch (error) {
    log('Unexpected login error:', error);
    return serverError('Internal server error');
  }
}
