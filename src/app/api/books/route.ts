import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BookService } from "@/services/book.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Body size limit (prevent large payload DoS) ─────────────────────────────
const MAX_BODY_SIZE = 25 * 1024; // 25 KB — more than enough for book data

async function getAuthenticatedUser(session: any) {
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const user = await getAuthenticatedUser(session);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Body size guard
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Solicitud demasiado grande" }, { status: 413 });
    }

    const data = await req.json();
    const book = await BookService.createBook(user.id, data);

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    console.error("Book Create API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el libro" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    const user = await getAuthenticatedUser(session);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const books = await BookService.getBooksByUserId(user.id);
    return NextResponse.json(books);
  } catch (error: any) {
    console.error("Book Fetch API Error:", error);
    return NextResponse.json({ error: "Error al obtener libros" }, { status: 500 });
  }
}
