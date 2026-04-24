"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error-pages.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass animate-fade-in`}>
        <h1 className={styles.errorCode}>Oops!</h1>
        <h2>Algo ha salido mal</h2>
        <p>Ha ocurrido un error inesperado. Estamos trabajando en ello para solucionarlo lo antes posible.</p>
        <div className={styles.actions}>
          <button onClick={() => reset()} className={styles.resetBtn}>
            Reintentar
          </button>
          <Link href="/" className={styles.homeBtn}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
