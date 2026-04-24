import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";

// ─── Security constants ───────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

// Magic bytes for image validation (prevents MIME type spoofing)
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png":  [[0x89, 0x50, 0x4e, 0x47]],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

function sanitizeFilename(filename: string): string {
  // Strip everything except alphanumeric, dots, dashes, underscores
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64); // max 64 chars for base
  return `${base}${ext}`;
}

export async function POST(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // ── Content-Length pre-check (DoS guard) ──────────────────────────────
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE * 1.1) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // ── Size validation ───────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar 5 MB" }, { status: 413 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    // ── MIME type validation ──────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF, AVIF)" },
        { status: 415 }
      );
    }

    // ── Extension validation ──────────────────────────────────────────────
    const rawExt = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
      return NextResponse.json(
        { error: "Extensión de archivo no permitida" },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Magic bytes validation (prevents file type spoofing) ─────────────
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "El contenido del archivo no corresponde a una imagen válida" },
        { status: 415 }
      );
    }

    // ── Filename sanitization (prevents path traversal) ───────────────────
    const safeName = sanitizeFilename(file.name);
    const filename = `${Date.now()}-${safeName}`;

    // Double-check: prevent any path traversal attempts
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, filename);
    if (!uploadPath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Ruta de archivo inválida" }, { status: 400 });
    }

    // ── Write file ────────────────────────────────────────────────────────
    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, buffer);

    // Return the protected API route (not the public static path)
    return NextResponse.json({
      url: `/api/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}
