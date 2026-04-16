import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  console.log("[Callback] Code:", code ? "exists" : "missing");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Callback] Exchange error:", error);
      return NextResponse.redirect(
        new URL("/auth/login?error=callback_error", requestUrl.origin),
      );
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (err) {
    console.error("[Callback] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=server_error", requestUrl.origin),
    );
  }
}
