import { NextResponse } from "next/server";
import { triggerBackup } from "@/lib/data/backup";

export async function POST() {
  try {
    const result = await triggerBackup();
    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("Backup trigger error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menjalankan backup" },
      { status: 500 },
    );
  }
}
