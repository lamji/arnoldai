import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Validates that the request is coming from the same origin.
 */
export async function isSameOrigin() {
  const headerList = await headers();
  const origin = headerList.get('origin');
  const host = headerList.get('host');

  if (!origin) return false;

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

/**
 * Validates the auth token from headers.
 */
export async function verifyToken() {
  const headerList = await headers();
  const authHeader = headerList.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as any;
  } catch (err) {
    return null;
  }
}

/**
 * Checks if the current request is from an authorized trainer.
 */
export async function isAuthorizedTrainer() {
  const decoded = await verifyToken();
  return decoded && (decoded.role === 'admin' || decoded.role === 'trainer');
}

/**
 * Checks if TRAINED_MODE is enabled in .env.local OR if the user is authorized.
 */
export async function isTrainedModeEnabled() {
  const envEnabled = process.env.TRAINED_MODE === 'true';
  if (envEnabled) return true;
  
  // If env is false, check if user is logged in as admin/trainer
  return await isAuthorizedTrainer();
}
