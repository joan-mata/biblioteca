const tgUrl = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

async function call(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(tgUrl(token, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  extra: Record<string, unknown> = {}
) {
  return call(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

export async function editMessageText(
  token: string,
  chatId: string | number,
  messageId: number,
  text: string,
  extra: Record<string, unknown> = {}
) {
  return call(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function editMessageReplyMarkup(
  token: string,
  chatId: string | number,
  messageId: number,
  replyMarkup: Record<string, unknown> | null = null
) {
  return call(token, "editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup ?? {},
  });
}

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string
) {
  return call(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

export async function setWebhook(token: string, url: string) {
  return call(token, "setWebhook", {
    url,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function deleteWebhook(token: string) {
  const res = await fetch(tgUrl(token, "deleteWebhook"), { method: "POST" });
  return res.json();
}

export async function getMe(token: string) {
  const res = await fetch(tgUrl(token, "getMe"));
  return res.json() as Promise<{ ok: boolean; result?: { username: string; first_name: string } }>;
}

export function inlineKeyboard(rows: { text: string; callback_data: string }[][]) {
  return { inline_keyboard: rows };
}
