import { NextResponse } from "next/server";
import { getBackupStatus } from "@/lib/data/backup";

export async function GET() {
  try {
    const status = await getBackupStatus();
    return NextResponse.json({ success: true, data: status });
  } catch (err) {
    console.error("Backup status error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat status backup" },
      { status: 500 },
    );
  }
}
