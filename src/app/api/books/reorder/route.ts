import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orders } = await req.json(); // Array of { id: string, wishlistOrder: number }

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    // Use a transaction for reliability
    await prisma.$transaction(
      orders.map((o) =>
        prisma.book.update({
          where: { id: o.id, userId: user.id },
          data: { wishlistOrder: o.wishlistOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
