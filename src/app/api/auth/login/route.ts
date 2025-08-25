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
import { verifyTurnstileToken } from '@/lib/turnstile';
import { getTurnstileSettings } from '@/queries/settings';
import debug from 'debug';

const log = debug('umami:login');

export async function POST(request: Request) {
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

    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
      turnstileToken: z.string().optional(),
    });

    const { body, error } = await parseRequest(request, schema, { skipAuth: true });

    if (error) {
      return error();
    }

    const { username, password, turnstileToken } = body;

    log(`Login attempt for username: ${username}`);

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
