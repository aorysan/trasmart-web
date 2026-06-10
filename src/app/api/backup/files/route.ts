import { NextResponse } from "next/server";
import { getBackupFiles } from "@/lib/data/backup";

export async function GET() {
  try {
    const files = await getBackupFiles();
    return NextResponse.json({ success: true, data: files });
  } catch (err) {
    console.error("Backup files error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar file backup" },
      { status: 500 },
    );
  }
}
