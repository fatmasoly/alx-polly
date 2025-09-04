import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

// Generate a secure random token
export function generateCSRFToken(): string {
  const buffer = randomBytes(32);
  return buffer.toString('hex');
}

// Store the CSRF token in a cookie
export function setCSRFCookie(): string {
  const token = generateCSRFToken();
  const cookieStore = cookies();
  
  // Set a secure, http-only cookie with the CSRF token
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  
  // Return a hash of the token to be included in forms
  return hashToken(token);
}

// Verify that the token from the form matches the one in the cookie
export function verifyCSRFToken(formToken: string): boolean {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('csrf_token')?.value;
  
  if (!cookieToken || !formToken) {
    return false;
  }
  
  // Compare the hashed cookie token with the form token
  return hashToken(cookieToken) === formToken;
}

// Hash the token to prevent token leakage
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Middleware to check CSRF token
export function csrfCheck(formData: FormData): { ok: boolean; error?: string } {
  const csrfToken = formData.get('csrf_token') as string;
  
  if (!csrfToken) {
    return { ok: false, error: 'CSRF token missing' };
  }
  
  if (!verifyCSRFToken(csrfToken)) {
    return { ok: false, error: 'Invalid CSRF token' };
  }
  
  return { ok: true };
}