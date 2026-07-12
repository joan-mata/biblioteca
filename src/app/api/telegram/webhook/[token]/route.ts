import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processUpdate } from "@/lib/telegram/handlers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const user = await prisma.user.findUnique({
      where: { telegramBotToken: token },
    });

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const update = await req.json();
    await processUpdate(token, user.id, update);
  } catch (err) {
    console.error("Telegram webhook error:", err);
  }

  // Always return 200 so Telegram doesn't retry
  return NextResponse.json({ ok: true }, { status: 200 });
}
