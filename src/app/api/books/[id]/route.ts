import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BookService } from "@/services/book.service";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser(session: any) {
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const user = await getAuthenticatedUser(session);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const book = await BookService.updateBook(user.id, id, data);

    return NextResponse.json(book);
  } catch (error: any) {
    console.error("Book Update API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el libro" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    const user = await getAuthenticatedUser(session);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await BookService.deleteBook(user.id, id);
    return NextResponse.json({ message: "Libro eliminado correctamente" });
  } catch (error: any) {
    console.error("Book Delete API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar el libro" },
      { status: 400 }
    );
  }
}
