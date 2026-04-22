import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span>Bibliot</span><span>eca</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.registerBtn}>Registrarse</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Tu biblioteca personal, <br />
            <span>Digitalizada.</span>
          </h1>
          <p className={styles.subtitle}>
            Organiza los libros que has leído, los que quieres leer y los que tienes en tu estantería. Todo en un solo lugar, con una experiencia premium.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/register" className={styles.ctaPrimary}>Empieza Gratis</Link>
            <Link href="#features" className={styles.ctaSecondary}>Saber Más</Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={`${styles.bookCard} glass animate-fade-in`}>
            <div className={styles.bookCoverPlaceholder}>
              <h3>El Principito</h3>
              <p>Antoine de Saint-Exupéry</p>
            </div>
            <div className={styles.bookInfo}>
              <div className={styles.rating}>★★★★★</div>
              <p>"Esencial para el alma."</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={`${styles.featureCard} glass`}>
            <h3>Control Total</h3>
            <p>Gestiona tu colección física y digital sin complicaciones.</p>
          </div>
          <div className={`${styles.featureCard} glass`}>
            <h3>Valoraciones</h3>
            <p>Puntúa y reseña tus lecturas para no olvidar nunca lo que sentiste.</p>
          </div>
          <div className={`${styles.featureCard} glass`}>
            <h3>Vistas Flexibles</h3>
            <p>Cambia entre vista de cuadrícula y lista según lo que necesites.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
