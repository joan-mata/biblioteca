"use client";

import { useState } from "react";
import styles from "./AddBookModal.module.css";
import { useRouter } from "next/navigation";

export default function AddBookModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [personalReview, setPersonalReview] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("READ");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, photoUrl, summary, personalReview, rating, status }),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding book:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass animate-fade-in`}>
        <div className={styles.header}>
          <h2>Añadir Nuevo Libro</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Título</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              placeholder="Ej: El Principito"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Autor</label>
            <input 
              type="text" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              required 
              placeholder="Ej: Antoine de Saint-Exupéry"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>URL de la Foto (Opcional)</label>
            <input 
              type="url" 
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
              placeholder="https://..."
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Resumen</label>
            <textarea 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)} 
              placeholder="¿De qué trata este libro?"
              rows={3}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Tu Opinión Personal</label>
            <textarea 
              value={personalReview} 
              onChange={(e) => setPersonalReview(e.target.value)} 
              placeholder="¿Qué te ha parecido el libro?"
              rows={3}
            />
          </div>
          
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="READ">Leído</option>
                <option value="TO_READ">Quiero leer</option>
                <option value="ON_SHELF">En estantería</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Valoración (1-5)</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                value={rating} 
                onChange={(e) => setRating(parseInt(e.target.value))} 
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Añadiendo..." : "Guardar Libro"}
          </button>
        </form>
      </div>
    </div>
  );
}
