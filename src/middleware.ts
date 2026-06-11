import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/middleware";

const protectedRoutes = ["/dashboard", "/account", "/reward", "/backup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|api/.*).*)"],
};
