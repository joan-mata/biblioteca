import Link from "next/link";
import styles from "./error-pages.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass animate-fade-in`}>
        <h1 className={styles.errorCode}>404</h1>
        <h2>Página no encontrada</h2>
        <p>Parece que este libro no está en nuestra estantería. Estamos trabajando en ello para que todo funcione perfectamente.</p>
        <Link href="/" className={styles.homeBtn}>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
