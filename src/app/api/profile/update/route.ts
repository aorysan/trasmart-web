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

  const body = await request.json();
  const { username, full_name, phone, address, avatar_url, city, postal_code } = body;

  const updates: Record<string, string> = {};
  if (username !== undefined) updates.username = username;
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (city !== undefined) updates.city = city;
  if (postal_code !== undefined) updates.postal_code = postal_code;

  const { data, error } = await supabase.rpc("update_user_profile", {
    p_updates: updates,
  });

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
