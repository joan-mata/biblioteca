import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import WishlistList from "./WishlistList";
import styles from "./wishlist.module.css";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession();
  
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email as string },
  });

  if (!user) return <div>No autorizado</div>;

  const wishlistBooks = await prisma.book.findMany({
    where: { 
      userId: user.id,
      status: "WANT_TO_READ"
    },
    orderBy: [
      { wishlistOrder: "asc" },
      { createdAt: "desc" }
    ],
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Prioridad de <span className="text-gradient">Lectura</span></h1>
        <p>Ordena los libros que tienes pendientes de lectura.</p>
      </header>

      <WishlistList initialBooks={JSON.parse(JSON.stringify(wishlistBooks))} />
    </div>
  );
}
