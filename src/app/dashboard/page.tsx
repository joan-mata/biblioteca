import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import BookList from "@/components/BookList";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();

  // Find the user to get their ID
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email as string },
  });

  if (!user) {
    return <div>Error de autenticación</div>;
  }

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Mis <span className="text-gradient">Libros</span></h1>
        <p>Gestiona tu colección y lleva un registro de tus lecturas.</p>
      </header>

      <BookList initialBooks={JSON.parse(JSON.stringify(books))} />
    </div>
  );
}
