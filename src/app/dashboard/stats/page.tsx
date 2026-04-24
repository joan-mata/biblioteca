import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import styles from "./stats.module.css";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession();
  
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email as string },
  });

  if (!user) return <div>No autorizado</div>;

  const books = await prisma.book.findMany({
    where: { userId: user.id },
  });

  const totalBooks = books.length;
  const readBooks = books.filter(b => b.status === "READ").length;
  const readingBooks = books.filter(b => b.status === "READING").length;
  const wantToReadBooks = books.filter(b => b.status === "WANT_TO_READ").length;
  
  const ownedBooks = books.filter(b => b.ownershipStatus === "OWNED").length;
  const averageRating = books.filter(b => b.rating).reduce((acc, b, _, arr) => acc + (b.rating || 0) / arr.length, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="text-gradient">Estadísticas</h1>
        <p>Un resumen visual de tu progreso literario.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <h3>Total Libros</h3>
          <p className={styles.statValue}>{totalBooks}</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Leídos</h3>
          <p className={styles.statValue}>{readBooks}</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Comprados</h3>
          <p className={styles.statValue}>{ownedBooks}</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Media Valoración</h3>
          <p className={styles.statValue}>{averageRating.toFixed(1)} ★</p>
        </div>
      </div>

      <div className={styles.detailedStats}>
        <div className={`${styles.chartCard} glass`}>
          <h3>Estado de la Colección</h3>
          <div className={styles.barContainer}>
            <div className={styles.barRow}>
              <span>Leídos ({readBooks})</span>
              <div className={styles.bar} style={{ width: `${(readBooks/totalBooks)*100 || 0}%`, background: '#6ee7b7' }}></div>
            </div>
            <div className={styles.barRow}>
              <span>Leyendo ({readingBooks})</span>
              <div className={styles.bar} style={{ width: `${(readingBooks/totalBooks)*100 || 0}%`, background: '#93c5fd' }}></div>
            </div>
            <div className={styles.barRow}>
              <span>Quiero leer ({wantToReadBooks})</span>
              <div className={styles.bar} style={{ width: `${(wantToReadBooks/totalBooks)*100 || 0}%`, background: '#a5b4fc' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
