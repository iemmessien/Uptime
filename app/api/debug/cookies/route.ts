import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const requestCookies = request.cookies.getAll();
  
  return NextResponse.json({
    'cookies-from-store': allCookies,
    'cookies-from-request': requestCookies,
    'auth-token-from-store': cookieStore.get('auth-token')?.value || null,
    'auth-token-from-request': request.cookies.get('auth-token')?.value || null,
  });
}
