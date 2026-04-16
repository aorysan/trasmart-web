import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/middleware';

// ✅ Protected routes yang require authentication
const protectedRoutes = [
  '/dashboard',
  '/account',
  '/reward',
  '/pages/dashboard',
  '/pages/account',
  '/pages/reward',
];

// ✅ Public routes (bisa diakses tanpa login)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Check apakah route ini protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // ✅ Ambil session dari cookie
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  console.log(`[Middleware] Path: ${pathname}, Has Session: ${!!session}`);

  // ✅ CASE 1: User mencoba akses protected route tapi belum login
  if (isProtectedRoute && !session) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /auth/login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // ✅ CASE 2: User sudah login tapi coba akses login/register page
  if ((pathname === '/auth/login' || pathname === '/auth/register') && session) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ✅ CASE 3: Request OK, lanjutkan
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};