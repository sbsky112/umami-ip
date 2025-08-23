import { secret } from '@/lib/crypto';
import { createToken, parseToken } from '@/lib/jwt';
import redis from '@/lib/redis';

export interface EmbedTokenPayload {
  websiteId: string;
  expiresAt: number;
  permissions: string[];
}

/**
 * Validate an embed token
 */
export async function validateEmbedToken(token: string, websiteId: string): Promise<boolean> {
  try {
    const payload = parseToken(token, secret()) as EmbedTokenPayload;
    
    // Check if token is valid
    if (!payload || !payload.expiresAt) {
      return false;
    }
    
    // Check if token is expired
    if (payload.expiresAt < Date.now()) {
      return false;
    }
    
    // Check if token matches the requested website
    if (payload.websiteId !== websiteId) {
      return false;
    }
    
    // Check if token has been revoked (if using Redis)
    if (redis.enabled) {
      const revoked = await redis.client.get(`embed_token_revoked:${token}`);
      if (revoked) {
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error('Embed token validation error:', e);
    return false;
  }
}

/**
 * Generate an embed token for website image access
 */
export async function generateEmbedToken(
  websiteId: string, 
  expiresInSeconds: number = 86400, // 24 hours default
  permissions: string[] = ['read']
): Promise<string> {
  const payload: EmbedTokenPayload = {
    websiteId,
    expiresAt: Date.now() + (expiresInSeconds * 1000),
    permissions,
  };
  
  return createToken(payload, secret(), { expiresIn: `${expiresInSeconds}s` });
}

/**
 * Revoke an embed token
 */
export async function revokeEmbedToken(token: string): Promise<void> {
  if (redis.enabled) {
    await redis.client.set(`embed_token_revoked:${token}`, '1', 'EX', 86400); // 24 hours
  }
}

/**
 * Parse and validate embed token payload
 */
export async function parseEmbedToken(token: string): Promise<EmbedTokenPayload | null> {
  try {
    const payload = parseToken(token, secret()) as EmbedTokenPayload;
    
    // Check if token is valid
    if (!payload || !payload.expiresAt) {
      return null;
    }
    
    // Check if token is expired
    if (payload.expiresAt < Date.now()) {
      return null;
    }
    
    // Check if token has been revoked
    if (redis.enabled) {
      const revoked = await redis.client.get(`embed_token_revoked:${token}`);
      if (revoked) {
        return null;
      }
    }
    
    return payload;
  } catch (e) {
    console.error('Embed token parsing error:', e);
    return null;
  }
}

/**
 * Check if a token has specific permissions
 */
export function hasEmbedPermission(token: EmbedTokenPayload, requiredPermission: string): boolean {
  return token.permissions.includes(requiredPermission);
}