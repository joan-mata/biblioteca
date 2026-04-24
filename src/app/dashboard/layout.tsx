import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import styles from "./dashboard.module.css";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.biblio}>Biblio</span><span className={`${styles.teca} text-gradient`}>teca</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>📚 Libros</Link>
            <Link href="/dashboard/stats" className={styles.navLink}>📊 Stats</Link>
            <Link href="/dashboard/settings" className={styles.navLink}>⚙️ Ajustes</Link>
          </nav>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{session.user?.email}</span>
          <Link href="/api/auth/signout" className={styles.logoutBtn}>Salir</Link>
        </div>
      </header>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
