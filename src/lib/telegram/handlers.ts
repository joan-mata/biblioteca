import { prisma } from "@/lib/prisma";
import { BookService } from "@/services/book.service";
import {
  sendMessage,
  editMessageReplyMarkup,
  answerCallbackQuery,
  inlineKeyboard,
} from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionData {
  results?: SearchResult[];
  pendingBook?: PendingBook;
  status?: string;
  rating?: number | null;
  bookId?: string;
  bookTitle?: string;
  currentStatus?: string;
  page?: number;
  lastMessageId?: number;
}

interface SearchResult {
  title: string;
  author: string;
  photoUrl: string | null;
  summary: string | null;
  year: string | null;
}

interface PendingBook {
  title: string;
  author: string;
  photoUrl: string | null;
  summary: string | null;
}

type BotSession = {
  id: string;
  chatId: string;
  userId: string;
  state: string;
  data: SessionData | null;
};

// ─── State helpers ────────────────────────────────────────────────────────────

async function getOrCreateSession(chatId: string, userId: string): Promise<BotSession> {
  const session = await prisma.botSession.upsert({
    where: { chatId_userId: { chatId, userId } },
    create: { chatId, userId, state: "IDLE", data: {} },
    update: {},
  });
  return { ...session, data: (session.data as SessionData) ?? {} };
}

async function saveSession(
  chatId: string,
  userId: string,
  state: string,
  data: SessionData
) {
  await prisma.botSession.update({
    where: { chatId_userId: { chatId, userId } },
    data: { state, data: data as any },
  });
}

async function resetSession(chatId: string, userId: string) {
  await saveSession(chatId, userId, "IDLE", {});
}

// ─── Google Books search ──────────────────────────────────────────────────────

async function searchBooks(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({ q: query, maxResults: "5", langRestrict: "es" });
  if (apiKey) params.set("key", apiKey);

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
    const json = await res.json();

    if (!json.items) return [];

    return json.items.map((item: any) => {
      const info = item.volumeInfo ?? {};
      return {
        title: info.title ?? "Sin título",
        author: (info.authors ?? ["Desconocido"]).join(", "),
        photoUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
        summary: info.description?.slice(0, 500) ?? null,
        year: info.publishedDate?.slice(0, 4) ?? null,
      };
    });
  } catch {
    return [];
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

const HELP_TEXT = `📚 <b>Tu biblioteca personal</b>

<b>Comandos disponibles:</b>

/buscar — Buscar y añadir un libro
/wishlist — Ver tu lista de deseos
/cambiar — Cambiar estado de un libro
/ayuda — Mostrar esta ayuda
/cancelar — Cancelar la acción actual

También puedes escribir directamente el título de un libro para buscarlo.

<b>¿Cómo añadir un libro?</b>
1. Escribe el título o usa /buscar
2. Elige entre los resultados encontrados
3. Indica si lo has leído, lo estás leyendo o lo quieres leer
4. Si lo leíste, puntúalo del 1 al 5
5. Indica si ya lo tienes en tu colección

<b>¿Cómo cambiar el estado?</b>
Usa /cambiar, selecciona el libro y elige el nuevo estado.

<b>Reseñas y resúmenes</b>
Para editarlos, accede a la web.`;

const statusLabel: Record<string, string> = {
  READ: "✅ Leído",
  READING: "📖 Leyendo",
  WANT_TO_READ: "📋 Quiero leerlo",
};

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function processUpdate(
  token: string,
  userId: string,
  update: Record<string, any>
) {
  if (update.message) {
    await handleMessage(token, userId, update.message);
  } else if (update.callback_query) {
    await handleCallback(token, userId, update.callback_query);
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(token: string, userId: string, message: Record<string, any>) {
  const chatId = String(message.chat.id);
  const text: string = message.text ?? "";
  const session = await getOrCreateSession(chatId, userId);

  if (text === "/start" || text === "/ayuda") {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, HELP_TEXT);
    return;
  }

  if (text === "/cancelar") {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, "❌ Acción cancelada.");
    return;
  }

  if (text === "/wishlist") {
    await resetSession(chatId, userId);
    await handleWishlist(token, chatId, userId);
    return;
  }

  if (text === "/cambiar") {
    await resetSession(chatId, userId);
    await handleChangeList(token, chatId, userId, 0);
    return;
  }

  const searchMatch = text.match(/^\/buscar\s+(.+)/i);
  if (searchMatch || session.state === "IDLE") {
    const query = searchMatch ? searchMatch[1] : text;
    if (!query.trim()) {
      await sendMessage(token, chatId, HELP_TEXT);
      return;
    }
    await handleSearch(token, chatId, userId, query.trim());
    return;
  }

  await sendMessage(token, chatId, "Usa los botones para continuar, o /cancelar para empezar de nuevo.");
}

// ─── Callback handler ─────────────────────────────────────────────────────────

async function handleCallback(token: string, userId: string, cb: Record<string, any>) {
  const chatId = String(cb.message.chat.id);
  const callbackId: string = cb.id;
  const data: string = cb.data ?? "";
  const messageId: number = cb.message.message_id;
  const session = await getOrCreateSession(chatId, userId);

  await answerCallbackQuery(token, callbackId);
  await editMessageReplyMarkup(token, chatId, messageId, null);

  const [action, value] = data.split(":");

  switch (action) {
    case "select_book":
      await handleSelectBook(token, chatId, userId, session, parseInt(value));
      break;
    case "read":
      await handleAskRead(token, chatId, userId, session, value as "yes" | "reading" | "no");
      break;
    case "rating":
      await handleAskRating(token, chatId, userId, session, parseInt(value));
      break;
    case "owned":
      await handleAskOwned(token, chatId, userId, session, value);
      break;
    case "page":
      await handleChangeList(token, chatId, userId, parseInt(value));
      break;
    case "change_book":
      await handleChangeBook(token, chatId, userId, session, value);
      break;
    case "set_status":
      await handleSetStatus(token, chatId, userId, session, value);
      break;
    case "cancel":
      await resetSession(chatId, userId);
      await sendMessage(token, chatId, "❌ Acción cancelada.");
      break;
  }
}

// ─── Flow: Search & Add ───────────────────────────────────────────────────────

async function handleSearch(token: string, chatId: string, userId: string, query: string) {
  await sendMessage(token, chatId, `🔍 Buscando <b>${query}</b>...`);

  const results = await searchBooks(query);

  if (results.length === 0) {
    await resetSession(chatId, userId);
    await sendMessage(
      token,
      chatId,
      "No encontré ningún libro con ese título. Intenta con otro nombre."
    );
    return;
  }

  const buttons = results.map((r, i) => [
    {
      text: `📚 ${r.title.slice(0, 40)} — ${r.author.slice(0, 25)}${r.year ? ` (${r.year})` : ""}`,
      callback_data: `select_book:${i}`,
    },
  ]);
  buttons.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

  await saveSession(chatId, userId, "SEARCH_RESULTS", { results });
  await sendMessage(token, chatId, "Selecciona el libro que quieres añadir:", {
    reply_markup: inlineKeyboard(buttons),
  });
}

async function handleSelectBook(
  token: string,
  chatId: string,
  userId: string,
  session: BotSession,
  index: number
) {
  const results = session.data?.results;
  if (!results || index >= results.length) {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, "Selección inválida. Escribe el título para buscar de nuevo.");
    return;
  }

  const book = results[index];
  await saveSession(chatId, userId, "ASK_READ", { pendingBook: book });

  await sendMessage(
    token,
    chatId,
    `📖 <b>${book.title}</b>\n👤 ${book.author}\n\n¿Cuál es tu situación con este libro?`,
    {
      reply_markup: inlineKeyboard([
        [
          { text: "✅ Lo he leído", callback_data: "read:yes" },
          { text: "📖 Lo estoy leyendo", callback_data: "read:reading" },
        ],
        [{ text: "📋 Lo quiero leer", callback_data: "read:no" }],
        [{ text: "❌ Cancelar", callback_data: "cancel" }],
      ]),
    }
  );
}

async function handleAskRead(
  token: string,
  chatId: string,
  userId: string,
  session: BotSession,
  answer: "yes" | "reading" | "no"
) {
  const pendingBook = session.data?.pendingBook;
  if (!pendingBook) {
    await resetSession(chatId, userId);
    return;
  }

  const statusMap = { yes: "READ", reading: "READING", no: "WANT_TO_READ" };
  const status = statusMap[answer];

  if (answer === "yes") {
    await saveSession(chatId, userId, "ASK_RATING", { pendingBook, status });
    await sendMessage(token, chatId, "¿Qué puntuación le das?", {
      reply_markup: inlineKeyboard([
        [
          { text: "⭐", callback_data: "rating:1" },
          { text: "⭐⭐", callback_data: "rating:2" },
          { text: "⭐⭐⭐", callback_data: "rating:3" },
          { text: "⭐⭐⭐⭐", callback_data: "rating:4" },
          { text: "⭐⭐⭐⭐⭐", callback_data: "rating:5" },
        ],
        [{ text: "Sin valoración", callback_data: "rating:0" }],
      ]),
    });
  } else {
    await saveSession(chatId, userId, "ASK_OWNED", { pendingBook, status, rating: null });
    await askOwnership(token, chatId);
  }
}

async function handleAskRating(
  token: string,
  chatId: string,
  userId: string,
  session: BotSession,
  rating: number
) {
  const { pendingBook, status } = session.data ?? {};
  if (!pendingBook) {
    await resetSession(chatId, userId);
    return;
  }

  await saveSession(chatId, userId, "ASK_OWNED", {
    pendingBook,
    status,
    rating: rating > 0 ? rating : null,
  });
  await askOwnership(token, chatId);
}

async function askOwnership(token: string, chatId: string) {
  await sendMessage(token, chatId, "¿Lo tienes en tu colección?", {
    reply_markup: inlineKeyboard([
      [
        { text: "📦 Sí, lo tengo", callback_data: "owned:OWNED" },
        { text: "🛒 Lo quiero comprar", callback_data: "owned:WISHLIST" },
      ],
      [{ text: "❌ No lo tengo", callback_data: "owned:NONE" }],
    ]),
  });
}

async function handleAskOwned(
  token: string,
  chatId: string,
  userId: string,
  session: BotSession,
  ownership: string
) {
  const { pendingBook, status, rating } = session.data ?? {};
  if (!pendingBook) {
    await resetSession(chatId, userId);
    return;
  }

  try {
    await BookService.createBook(userId, {
      title: pendingBook.title,
      author: pendingBook.author,
      photoUrl: pendingBook.photoUrl ?? undefined,
      summary: pendingBook.summary ?? undefined,
      status: status ?? "WANT_TO_READ",
      rating: rating ?? undefined,
      ownershipStatus: (ownership as any) ?? "NONE",
      isOwned: ownership === "OWNED",
    } as any);

    const ownershipLabel: Record<string, string> = {
      OWNED: "📦 En tu colección",
      WISHLIST: "🛒 Por comprar",
      NONE: "❌ No lo tienes",
    };

    await resetSession(chatId, userId);
    await sendMessage(
      token,
      chatId,
      `✅ <b>Libro añadido con éxito!</b>\n\n📚 <b>${pendingBook.title}</b>\n👤 ${pendingBook.author}\n📖 ${statusLabel[status ?? "WANT_TO_READ"]}\n${rating ? `⭐ Valoración: ${rating}/5\n` : ""}${ownershipLabel[ownership] ?? ""}\n\n<i>Para añadir reseña o editar el resumen, ve a la web.</i>`
    );
  } catch (err: any) {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, `❌ Error al guardar: ${err.message}`);
  }
}

// ─── Flow: Wishlist ───────────────────────────────────────────────────────────

async function handleWishlist(token: string, chatId: string, userId: string) {
  const books = await prisma.book.findMany({
    where: { userId, status: "WANT_TO_READ" },
    orderBy: [{ wishlistOrder: "asc" }, { createdAt: "asc" }],
    take: 30,
  });

  if (books.length === 0) {
    await sendMessage(token, chatId, "Tu lista de deseos está vacía. Usa /buscar para añadir libros.");
    return;
  }

  const lines = books.map((b, i) => `${i + 1}. <b>${b.title}</b> — ${b.author}`).join("\n");
  await sendMessage(token, chatId, `📋 <b>Tu lista de deseos (${books.length})</b>\n\n${lines}`);
}

// ─── Flow: Change Status ──────────────────────────────────────────────────────

const PAGE_SIZE = 8;

async function handleChangeList(
  token: string,
  chatId: string,
  userId: string,
  page: number
) {
  const total = await prisma.book.count({ where: { userId } });

  if (total === 0) {
    await sendMessage(token, chatId, "No tienes libros en tu biblioteca.");
    return;
  }

  const books = await prisma.book.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const bookButtons = books.map((b) => [
    { text: `${statusLabel[b.status] ?? b.status} — ${b.title.slice(0, 35)}`, callback_data: `change_book:${b.id}` },
  ]);

  const nav: { text: string; callback_data: string }[] = [];
  if (page > 0) nav.push({ text: "⬅️ Anterior", callback_data: `page:${page - 1}` });
  if ((page + 1) * PAGE_SIZE < total) nav.push({ text: "Siguiente ➡️", callback_data: `page:${page + 1}` });
  if (nav.length > 0) bookButtons.push(nav);
  bookButtons.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

  await saveSession(chatId, userId, "CHANGE_LIST", { page });
  await sendMessage(token, chatId, `¿Qué libro quieres actualizar? (${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total})`, {
    reply_markup: inlineKeyboard(bookButtons),
  });
}

async function handleChangeBook(
  token: string,
  chatId: string,
  userId: string,
  _session: BotSession,
  bookId: string
) {
  const book = await prisma.book.findFirst({ where: { id: bookId, userId } });
  if (!book) {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, "Libro no encontrado.");
    return;
  }

  await saveSession(chatId, userId, "CHANGE_BOOK", {
    bookId: book.id,
    bookTitle: book.title,
    currentStatus: book.status,
  });

  await sendMessage(
    token,
    chatId,
    `📚 <b>${book.title}</b>\nEstado actual: ${statusLabel[book.status] ?? book.status}\n\nNuevo estado:`,
    {
      reply_markup: inlineKeyboard([
        [
          { text: "📋 Quiero leerlo", callback_data: "set_status:WANT_TO_READ" },
          { text: "📖 Leyendo", callback_data: "set_status:READING" },
        ],
        [{ text: "✅ Leído", callback_data: "set_status:READ" }],
        [{ text: "❌ Cancelar", callback_data: "cancel" }],
      ]),
    }
  );
}

async function handleSetStatus(
  token: string,
  chatId: string,
  userId: string,
  session: BotSession,
  newStatus: string
) {
  const { bookId, bookTitle } = session.data ?? {};
  if (!bookId) {
    await resetSession(chatId, userId);
    return;
  }

  try {
    const existing = await prisma.book.findFirst({ where: { id: bookId, userId } });
    if (!existing) throw new Error("Libro no encontrado");

    await BookService.updateBook(userId, bookId, {
      title: existing.title,
      author: existing.author,
      status: newStatus as any,
    });

    await resetSession(chatId, userId);
    await sendMessage(
      token,
      chatId,
      `✅ Actualizado: <b>${bookTitle}</b>\nNuevo estado: ${statusLabel[newStatus] ?? newStatus}`
    );
  } catch (err: any) {
    await resetSession(chatId, userId);
    await sendMessage(token, chatId, `❌ Error al actualizar: ${err.message}`);
  }
}
