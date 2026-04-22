import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await AuthService.registerUser(email, password);

    return NextResponse.json(
      { message: "Usuario creado correctamente", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message === "El usuario ya existe" ? 400 : 500 }
    );
  }
}
