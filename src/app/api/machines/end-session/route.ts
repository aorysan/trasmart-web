import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, message: "Kamu harus login terlebih dahulu." },
      { status: 401 }
    );
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

  const headers = {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };

  const sessionRes = await fetch(
    `${SUPABASE_URL}/rest/v1/machine_sessions?user_id=eq.${user.id}&status=eq.paired&select=id,machine_id`,
    { headers }
  );

  if (!sessionRes.ok) {
    return NextResponse.json(
      { success: false, message: "Gagal mencari sesi aktif." },
      { status: 500 }
    );
  }

  const sessions = await sessionRes.json();
  const session = sessions?.[0];

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Tidak ada sesi aktif." },
      { status: 404 }
    );
  }

  const patchHeaders = { ...headers, Prefer: "return=minimal" };

  // Set old session as completed (RPC generate_machine_session will delete it)
  await fetch(`${SUPABASE_URL}/rest/v1/machine_sessions?id=eq.${session.id}`, {
    method: "PATCH",
    headers: patchHeaders,
    body: JSON.stringify({
      status: "completed",
      user_id: null,
      expires_at: null,
      paired_at: null,
    }),
  });

  // Clear machine pairing
  await fetch(`${SUPABASE_URL}/rest/v1/machines?id=eq.${session.machine_id}`, {
    method: "PATCH",
    headers: patchHeaders,
    body: JSON.stringify({ current_user_id: null }),
  });

  // Generate fresh session code via RPC
  const rpcRes = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/generate_machine_session`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ p_machine_id: session.machine_id }),
    }
  );

  const sessionCode = rpcRes.ok ? await rpcRes.json() : null;

  return NextResponse.json({ success: true, session_code: sessionCode });
}
