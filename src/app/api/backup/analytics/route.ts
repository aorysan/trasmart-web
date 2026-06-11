import { NextRequest, NextResponse } from "next/server";
import { runAnalytics, getAllAnalyticsResults, getAnalyticsResult } from "@/lib/data/backup";

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("job");
    if (jobId) {
      const result = await getAnalyticsResult(jobId);
      if (!result) {
        return NextResponse.json({ success: false, message: "Job tidak ditemukan atau belum dijalankan" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result });
    }

    const results = await getAllAnalyticsResults();
    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ success: false, message: "Gagal memuat hasil analytics" }, { status: 500 });
  }
}

export async function POST() {
  const result = await runAnalytics();
  if (result.success) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result, { status: 500 });
}
