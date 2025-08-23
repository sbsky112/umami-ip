import { checkAuth } from '@/lib/auth';
import { canViewWebsite } from '@/lib/auth';
import { getWebsite, getSharedWebsite } from '@/queries/prisma/website';
import { validateEmbedToken } from '@/lib/embed-token';
import { unauthorized, notFound } from '@/lib/response';

export interface AuthResult {
  success: boolean;
  website?: any;
  accessMethod?: string;
  error?: string;
}

/**
 * Authenticate access to website image endpoint
 * Supports multiple authentication methods:
 * 1. Embed token for embedded images
 * 2. Share ID for shared websites
 * 3. Regular authentication for logged-in users
 */
export async function authenticateImageAccess(
  request: Request,
  websiteId: string,
  shareId?: string,
  embedToken?: string
): Promise<AuthResult> {
  try {
    // Method 1: Embed token access (for embedded images)
    if (embedToken) {
      const isValidEmbedToken = await validateEmbedToken(embedToken, websiteId);
      if (isValidEmbedToken) {
        const website = await getWebsite({ id: websiteId });
        if (website) {
          return {
            success: true,
            website,
            accessMethod: 'embed_token'
          };
        }
      }
    }
    
    // Method 2: Share ID access (for shared websites)
    if (shareId) {
      const sharedWebsite = await getSharedWebsite(shareId);
      if (sharedWebsite && sharedWebsite.id === websiteId) {
        return {
          success: true,
          website: sharedWebsite,
          accessMethod: 'share_id'
        };
      }
    }
    
    // Method 3: Authenticated access (for logged-in users)
    const auth = await checkAuth(request);
    if (auth) {
      const hasAccess = await canViewWebsite(auth, websiteId);
      if (hasAccess) {
        const website = await getWebsite({ id: websiteId });
        if (website) {
          return {
            success: true,
            website,
            accessMethod: 'authenticated'
          };
        }
      }
    }

    return {
      success: false,
      error: 'Access denied'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Get appropriate cache control headers based on access method
 */
export function getCacheControl(accessMethod: string): string {
  switch (accessMethod) {
    case 'embed_token':
      return 'public, max-age=300'; // 5 minutes for embed tokens
    case 'share_id':
      return 'public, max-age=1800'; // 30 minutes for shared links
    case 'authenticated':
      return 'public, max-age=3600'; // 1 hour for authenticated users
    default:
      return 'no-cache, no-store, must-revalidate';
  }
}