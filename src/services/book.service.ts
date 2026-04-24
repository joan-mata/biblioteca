import { prisma } from "@/lib/prisma";
import { Book } from "@/types";

// ─── Field length limits ──────────────────────────────────────────────────────
const LIMITS = {
  title: 500,
  author: 300,
  photoUrl: 2048,
  summary: 10_000,
  personalReview: 10_000,
  readingHours: 50000, // max hours
};

// ─── Allowed enum values ──────────────────────────────────────────────────────
const VALID_STATUSES = ["READ", "READING", "WANT_TO_READ"] as const;
const VALID_OWNERSHIP = ["OWNED", "WISHLIST", "NONE"] as const;

function sanitizeString(val: unknown, maxLength: number): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val !== "string") return null;
  return val.trim().slice(0, maxLength);
}

function validateBookData(data: Partial<Book>): void {
  if (!data.title?.trim()) throw new Error("El título es requerido");
  if (!data.author?.trim()) throw new Error("El autor es requerido");

  if (data.status && !VALID_STATUSES.includes(data.status as any)) {
    throw new Error("Estado de lectura inválido");
  }

  if (data.ownershipStatus && !VALID_OWNERSHIP.includes(data.ownershipStatus as any)) {
    throw new Error("Estado de propiedad inválido");
  }

  if (data.rating !== null && data.rating !== undefined) {
    const r = Number(data.rating);
    if (isNaN(r) || r < 1 || r > 5) throw new Error("La valoración debe ser entre 1 y 5");
  }

  if (data.readingHours !== null && data.readingHours !== undefined) {
    const h = Number(data.readingHours);
    if (isNaN(h) || h < 0 || h > LIMITS.readingHours) throw new Error("Horas de lectura inválidas");
  }

  if (data.title && data.title.length > LIMITS.title) {
    throw new Error(`El título no puede superar ${LIMITS.title} caracteres`);
  }

  if (data.author && data.author.length > LIMITS.author) {
    throw new Error(`El autor no puede superar ${LIMITS.author} caracteres`);
  }

  if (data.summary && data.summary.length > LIMITS.summary) {
    throw new Error(`El resumen no puede superar ${LIMITS.summary} caracteres`);
  }

  if (data.personalReview && data.personalReview.length > LIMITS.personalReview) {
    throw new Error(`La opinión no puede superar ${LIMITS.personalReview} caracteres`);
  }

  if (data.photoUrl && data.photoUrl.length > LIMITS.photoUrl) {
    throw new Error("URL de foto demasiado larga");
  }

  // Validate dates are actual dates
  const dateFields = ["purchaseDate", "startedAt", "finishedAt"] as const;
  for (const field of dateFields) {
    if (data[field]) {
      const d = new Date(data[field] as string);
      if (isNaN(d.getTime())) throw new Error(`Fecha inválida en el campo ${field}`);
      // Sanity check: not in the far future or past
      const year = d.getFullYear();
      if (year < 1000 || year > 2100) throw new Error(`Año inválido en el campo ${field}`);
    }
  }
}

export class BookService {
  static async getBooksByUserId(userId: string) {
    return prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createBook(userId: string, data: Partial<Book>) {
    validateBookData(data);

    return prisma.book.create({
      data: {
        title: data.title!.trim().slice(0, LIMITS.title),
        author: data.author!.trim().slice(0, LIMITS.author),
        photoUrl: sanitizeString(data.photoUrl, LIMITS.photoUrl),
        summary: sanitizeString(data.summary, LIMITS.summary),
        personalReview: sanitizeString(data.personalReview, LIMITS.personalReview),
        rating: data.rating ? Math.min(5, Math.max(1, Number(data.rating))) : null,
        status: VALID_STATUSES.includes(data.status as any) ? data.status! : "WANT_TO_READ",
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate as string) : null,
        isOwned: data.ownershipStatus === "OWNED",
        ownershipStatus: VALID_OWNERSHIP.includes(data.ownershipStatus as any)
          ? data.ownershipStatus!
          : "NONE",
        startedAt: data.startedAt ? new Date(data.startedAt as string) : null,
        finishedAt: data.finishedAt ? new Date(data.finishedAt as string) : null,
        readingHours: data.readingHours != null ? Math.min(LIMITS.readingHours, Math.max(0, Number(data.readingHours))) : null,
        userId,
      },
    });
  }

  static async updateBook(userId: string, bookId: string, data: Partial<Book>) {
    // Validate bookId format (Prisma CUID)
    if (typeof bookId !== "string" || bookId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(bookId)) {
      throw new Error("ID de libro inválido");
    }

    // Ensure the book belongs to the user (prevents IDOR attacks)
    const existing = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existing) {
      throw new Error("Libro no encontrado o no autorizado");
    }

    validateBookData(data);

    return prisma.book.update({
      where: { id: bookId },
      data: {
        title: data.title?.trim().slice(0, LIMITS.title),
        author: data.author?.trim().slice(0, LIMITS.author),
        photoUrl: sanitizeString(data.photoUrl, LIMITS.photoUrl),
        summary: sanitizeString(data.summary, LIMITS.summary),
        personalReview: sanitizeString(data.personalReview, LIMITS.personalReview),
        rating: data.rating != null ? Math.min(5, Math.max(1, Number(data.rating))) : null,
        status: VALID_STATUSES.includes(data.status as any) ? data.status : existing.status,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate as string) : null,
        isOwned: data.ownershipStatus === "OWNED",
        ownershipStatus: VALID_OWNERSHIP.includes(data.ownershipStatus as any)
          ? data.ownershipStatus
          : existing.ownershipStatus,
        startedAt: data.startedAt ? new Date(data.startedAt as string) : null,
        finishedAt: data.finishedAt ? new Date(data.finishedAt as string) : null,
        readingHours: data.readingHours != null ? Math.min(LIMITS.readingHours, Math.max(0, Number(data.readingHours))) : null,
      },
    });
  }

  static async deleteBook(userId: string, bookId: string) {
    // Validate bookId format
    if (typeof bookId !== "string" || bookId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(bookId)) {
      throw new Error("ID de libro inválido");
    }

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
