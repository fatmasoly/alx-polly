import { NextResponse } from 'next/server';
import { setCSRFCookie } from '@/app/lib/security/csrf';

export async function GET() {
  try {
    // Generate a CSRF token and set it in a cookie
    const token = setCSRFCookie();
    
    // Return the token to be used in forms
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}