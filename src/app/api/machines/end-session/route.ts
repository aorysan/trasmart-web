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

  const { data, error } = await supabase.rpc("end_machine_session");

  if (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengakhiri sesi." },
      { status: 500 }
    );
  }

  if (!data?.success) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "Tidak ada sesi aktif." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
