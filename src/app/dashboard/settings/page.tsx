import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();
  
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email as string },
  });

  if (!user) return <div>No autorizado</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="text-gradient">Ajustes</h1>
        <p>Gestiona tu cuenta y preferencias de la biblioteca.</p>
      </header>

      <div className={styles.content}>
        <section className={`${styles.section} glass`}>
          <h3>Mi Perfil</h3>
          <div className={styles.infoRow}>
            <span>Email:</span>
            <strong>{user.email}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Rol:</span>
            <strong>{user.role}</strong>
          </div>
        </section>

        <section className={`${styles.section} glass`}>
          <h3>Preferencias</h3>
          <p className={styles.placeholder}>Próximamente: Modo oscuro/claro, exportar datos (CSV/JSON), y más.</p>
        </section>

        <section className={`${styles.section} glass`}>
          <h3>Seguridad</h3>
          <button className={styles.btnSecondary} disabled>Cambiar Contraseña</button>
        </section>
      </div>
    </div>
  );
}
