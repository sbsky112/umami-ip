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
import debug from 'debug';

const log = debug('umami:login');

async function verifyTurnstileToken(token: string) {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY!)}&response=${encodeURIComponent(token)}`,
    }
  );
  
  const data = await response.json();
  return data;
}

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
      turnstileToken: z.string().min(1, 'Turnstile verification is required'),
    });

    const { body, error } = await parseRequest(request, schema, { skipAuth: true });

    if (error) {
      return error();
    }

    const { username, password, turnstileToken } = body;

    log(`Login attempt for username: ${username}`);

    // Verify Turnstile token if secret key is configured
    if (process.env.TURNSTILE_SECRET_KEY) {
      try {
        const verification = await verifyTurnstileToken(turnstileToken);
        if (!verification.success) {
          log(`Turnstile verification failed for user: ${username}`);
          return unauthorized('message.turnstile-verification-failed');
        }
      } catch (error) {
        log('Turnstile verification error:', error);
        return unauthorized('message.turnstile-verification-error');
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
