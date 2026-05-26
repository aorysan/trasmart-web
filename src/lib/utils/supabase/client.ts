import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (rememberMe = true) => {
  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: {
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
      },
    },
  );
};
