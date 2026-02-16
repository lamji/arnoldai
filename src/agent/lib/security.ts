import { headers } from 'next/headers';

/**
 * Validates that the request is coming from the same origin.
 * Note: Headers can be spoofed by non-browser clients, so this is 
 * best used alongside an API key for sensitive routes.
 */
export async function isSameOrigin() {
  const headerList = await headers();
  const origin = headerList.get('origin');
  const host = headerList.get('host');

  if (!origin) return false;

  // Convert host to a URL-like format to compare with origin
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const expectedOrigin = `${protocol}://${host}`;

  return origin === expectedOrigin;
}

/**
 * Validates the admin secret key for administrative endpoints.
 */
export async function isAdmin() {
  const headerList = await headers();
  const adminKey = headerList.get('x-admin-key');
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey) {
    console.warn("🔐 SECURITY ALERT: ADMIN_SECRET_KEY is not defined in .env.local");
    return false;
  }

  return adminKey === expectedKey;
}
