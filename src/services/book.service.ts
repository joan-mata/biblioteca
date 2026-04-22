import { prisma } from "@/lib/prisma";
import { Book } from "@/types";

export class BookService {
  static async getBooksByUserId(userId: string) {
    return prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createBook(userId: string, data: Partial<Book>) {
    if (!data.title || !data.author) {
      throw new Error("Título y autor son requeridos");
    }

    return prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        photoUrl: data.photoUrl,
        summary: data.summary,
        personalReview: data.personalReview,
        rating: data.rating,
        status: data.status || "READ",
        userId: userId,
      },
    });
  }

  static async updateBook(userId: string, bookId: string, data: Partial<Book>) {
    // Ensure the book belongs to the user
    const existing = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existing) {
      throw new Error("Libro no encontrado o no autorizado");
    }

    return prisma.book.update({
      where: { id: bookId },
      data: {
        title: data.title,
        author: data.author,
        photoUrl: data.photoUrl,
        summary: data.summary,
        personalReview: data.personalReview,
        rating: data.rating,
        status: data.status,
      },
    });
  }

  static async deleteBook(userId: string, bookId: string) {
    const existing = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existing) {
      throw new Error("Libro no encontrado o no autorizado");
    }

    return prisma.book.delete({
      where: { id: bookId },
    });
  }
}
