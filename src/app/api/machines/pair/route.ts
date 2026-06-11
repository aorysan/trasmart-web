import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, message: "Kamu harus login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { success: false, message: "Kode tidak boleh kosong." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("pair_user_with_machine", {
    p_session_code: code.trim().toUpperCase(),
  });

  if (error) {
    console.error("Pairing error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat pairing." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
