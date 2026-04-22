import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/masukkan-kode",
  "/account",
  "/reward",
  "/pages/dashboard",
  "/pages/masukkan-kode",
  "/pages/account",
  "/pages/reward",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[Middleware] Path: ${pathname}, Has User: ${!!user}`);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    (pathname === "/auth/login" ||
      pathname === "/auth/register" ||
      pathname === "/") &&
    user
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
