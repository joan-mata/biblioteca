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
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span>Bibliot</span><span>eca</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>📚 Mis Libros</Link>
          <Link href="/dashboard/stats" className={styles.navLink}>📊 Estadísticas</Link>
          <Link href="/dashboard/settings" className={styles.navLink}>⚙️ Ajustes</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <p>{session.user?.email}</p>
          <Link href="/api/auth/signout" className={styles.logoutBtn}>Cerrar Sesión</Link>
        </div>
      </aside>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
