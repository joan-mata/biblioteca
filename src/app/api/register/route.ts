import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

// ─── Rate limiting (simple in-memory for single instance) ────────────────────
const registrationAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_REGISTER_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = registrationAttempts.get(ip);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    registrationAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  if (entry.count >= MAX_REGISTER_ATTEMPTS) {
    return true;
  }

  entry.count++;
  return false;
}

// ─── Input validation ─────────────────────────────────────────────────────────
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

export async function POST(req: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Demasiados intentos de registro. Inténtalo en 1 hora." },
        { status: 429 }
      );
    }

    // ── Body size guard ────────────────────────────────────────────────────
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 413 });
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    // ── Input validation ───────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "La contraseña debe tener entre 8 y 128 caracteres" },
        { status: 400 }
      );
    }

    const user = await AuthService.registerUser(email, password);

    // Don't expose user data in response
    return NextResponse.json(
      { message: "Usuario creado correctamente" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register API Error:", error);
    // Don't leak internal error details
    if (error.message === "El usuario ya existe") {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
