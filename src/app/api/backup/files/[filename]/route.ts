import { NextRequest, NextResponse } from "next/server";
import { getFilePreview, getFileRaw } from "@/lib/data/backup";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const searchParams = request.nextUrl.searchParams;

    const isDownload = searchParams.get("download") === "true";
    if (isDownload) {
      const csvText = await getFileRaw(filename);
      return new NextResponse(csvText, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    const preview = await getFilePreview(filename, page, pageSize);
    return NextResponse.json({ success: true, data: preview });
  } catch (err) {
    console.error("File preview error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat preview file" },
      { status: 500 },
    );
  }
}
