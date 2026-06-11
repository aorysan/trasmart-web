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

  const { data: session } = await supabase
    .from("machine_sessions")
    .select("machine_id")
    .eq("user_id", user.id)
    .eq("status", "paired")
    .single();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Tidak ada sesi aktif." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase.rpc("refresh_session_expiry", {
    p_machine_id: session.machine_id,
  });

  if (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal refresh timer." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Timer tidak di-refresh." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    expires_at: data,
  });
}
