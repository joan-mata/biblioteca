import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getMe, setWebhook, deleteWebhook } from "@/lib/telegram/api";

export const dynamic = "force-dynamic";

async function getUser(session: any) {
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const session = await getServerSession();
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!user.telegramBotToken) {
    return NextResponse.json({ connected: false });
  }

  const info = await getMe(user.telegramBotToken);
  if (!info.ok) {
    // Token invalid — clean it up
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramBotToken: null },
    });
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    botUsername: info.result?.username ? `@${info.result.username}` : info.result?.first_name,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== "string" || token.length > 200) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  // Validate token with Telegram
  const info = await getMe(token);
  if (!info.ok) {
    return NextResponse.json({ error: "Token de bot inválido. Verifica que esté bien escrito." }, { status: 400 });
  }

  // Check token not already used by another user
  const existing = await prisma.user.findUnique({ where: { telegramBotToken: token } });
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "Este bot ya está vinculado a otra cuenta." }, { status: 409 });
  }

  // Remove old webhook if token changed
  if (user.telegramBotToken && user.telegramBotToken !== token) {
    await deleteWebhook(user.telegramBotToken);
  }

  // Save token
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramBotToken: token },
  });

  // Register webhook
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  const webhookUrl = `${appUrl}/api/telegram/webhook/${token}`;
  await setWebhook(token, webhookUrl);

  return NextResponse.json({
    connected: true,
    botUsername: info.result?.username ? `@${info.result.username}` : info.result?.first_name,
  });
}

export async function DELETE() {
  const session = await getServerSession();
  const user = await getUser(session);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (user.telegramBotToken) {
    await deleteWebhook(user.telegramBotToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramBotToken: null },
    });
  }

  return NextResponse.json({ connected: false });
}
