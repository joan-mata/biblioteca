"use client";

import { useState, useEffect } from "react";
import styles from "./telegram.module.css";

interface TelegramStatus {
  connected: boolean;
  botUsername?: string;
}

export default function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/user/telegram")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
      } else {
        setStatus(data);
        setToken("");
        setSuccess(`Bot ${data.botUsername ?? ""} conectado correctamente.`);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/telegram", { method: "DELETE" });
      if (res.ok) {
        setStatus({ connected: false });
        setSuccess("Bot desconectado.");
      }
    } catch {
      setError("Error al desconectar.");
    } finally {
      setLoading(false);
    }
  }

  if (!status) {
    return <p className={styles.loading}>Cargando...</p>;
  }

  return (
    <div className={styles.wrapper}>
      {status.connected ? (
        <div className={styles.connectedBlock}>
          <div className={styles.connectedInfo}>
            <span className={styles.dot} />
            <span>Bot conectado: <strong>{status.botUsername}</strong></span>
          </div>
          <div className={styles.capabilities}>
            <p>Tu bot puede:</p>
            <ul>
              <li>🔍 <code>/buscar</code> — Buscar y añadir libros</li>
              <li>📋 <code>/wishlist</code> — Ver tu lista de deseos</li>
              <li>✏️ <code>/cambiar</code> — Cambiar estado de un libro</li>
            </ul>
          </div>
          <button
            className={styles.btnDanger}
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? "Desconectando..." : "Desconectar bot"}
          </button>
        </div>
      ) : (
        <div>
          <div className={styles.steps}>
            <p className={styles.stepsTitle}>Cómo configurar tu bot:</p>
            <ol>
              <li>Abre Telegram y busca <strong>@BotFather</strong></li>
              <li>Escribe <code>/newbot</code> y sigue los pasos</li>
              <li>Copia el token que te da y pégalo aquí</li>
            </ol>
          </div>
          <form onSubmit={handleSave} className={styles.form}>
            <input
              type="text"
              className={styles.input}
              placeholder="123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className={styles.btnPrimary} disabled={loading || !token.trim()}>
              {loading ? "Conectando..." : "Conectar bot"}
            </button>
          </form>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMsg}>{success}</p>}
    </div>
  );
}
