import { NextResponse } from 'next/server';
import { adminCheck } from '@/app/lib/security/authorization';

export async function middleware() {
  // Check if the user is an admin
  const adminResult = await adminCheck();
  
  if (!adminResult.ok) {
    // Redirect to unauthorized page or dashboard
    return NextResponse.redirect(new URL('/unauthorized', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/(dashboard)/admin/:path*'],
};