import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    let contentType = "image/jpeg";
    if (filename.endsWith(".png")) contentType = "image/png";
    if (filename.endsWith(".webp")) contentType = "image/webp";
    if (filename.endsWith(".gif")) contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
