"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./AddBookModal.module.css";
import StarRating from "./StarRating";
import { Book } from "@/types";

interface AddBookModalProps {
  onClose: () => void;
  bookToEdit?: Book;
}

export default function AddBookModal({ onClose, bookToEdit }: AddBookModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(bookToEdit ? 'view' : 'edit');
  const [title, setTitle] = useState(bookToEdit?.title || "");
  const [author, setAuthor] = useState(bookToEdit?.author || "");
  const [photoUrl, setPhotoUrl] = useState(bookToEdit?.photoUrl || "");
  const [summary, setSummary] = useState(bookToEdit?.summary || "");
  const [personalReview, setPersonalReview] = useState(bookToEdit?.personalReview || "");
  const [rating, setRating] = useState(bookToEdit?.rating || 5);
  const [status, setStatus] = useState(bookToEdit?.status || "READ");
  const [ownershipStatus, setOwnershipStatus] = useState<"OWNED" | "WISHLIST" | "NONE">(
    bookToEdit?.ownershipStatus as any || (bookToEdit ? (bookToEdit.isOwned ? "OWNED" : "NONE") : "WISHLIST")
  );
  
  // New fields
  const [purchaseDate, setPurchaseDate] = useState(bookToEdit?.purchaseDate?.split('T')[0] || "");
  const [startedAt, setStartedAt] = useState(bookToEdit?.startedAt?.split('T')[0] || "");
  const [finishedAt, setFinishedAt] = useState(bookToEdit?.finishedAt?.split('T')[0] || "");
  const [readingHours, setReadingHours] = useState(bookToEdit?.readingHours?.toString() || "");
  const [isFavorite, setIsFavorite] = useState(bookToEdit?.isFavorite || false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        // The API already returns the full /api/uploads/... path
        setPhotoUrl(data.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Manual search only (triggered by button or Enter)

  const searchBooks = async (query: string) => {
    console.log("🔍 Triggering manual search for:", query);
    if (!query.trim() || isSearching) return;
    // Cancel previous request if any
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    const controller = new AbortController();
    searchAbortController.current = controller;

    setIsSearching(true);
    setSearchError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${apiKey ? `&key=${apiKey}` : ""}`;
      
      const res = await fetch(url, { signal: controller.signal });
      
      if (!res.ok) {
        // If it's a rate limit (429), give a specific message
        if (res.status === 429) {
           throw new Error("Límite de Google excedido. Espera unos segundos o usa una API Key.");
        }
        throw new Error(`Error de API: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Only update if this is still the active request
      if (!controller.signal.aborted) {
        setSearchResults(data.items || []);
        if (!data.items) {
          setSearchResults([]);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Ignore cancelled requests
      }
      console.error("Search error:", error);
      setSearchError(error.message.includes("Demasiadas") 
        ? error.message 
        : "Hubo un problema al conectar con la base de datos de libros. Revisa tu conexión.");
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  const handleSelectBook = (book: any) => {
    const info = book.volumeInfo;
    setTitle(info.title || "");
    setAuthor(info.authors?.[0] || "");
    setPhotoUrl(info.imageLinks?.thumbnail?.replace('http:', 'https:') || "");
    setSummary(info.description || "");
    setSearchResults([]);
    setSearchQuery("");
  };

  // Automatic logic for "Owned" and "Status" based on dates
  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    if (val) setOwnershipStatus("OWNED");
  };

  const handleStartedAtChange = (val: string) => {
    setStartedAt(val);
    if (val && !finishedAt) setStatus("READING");
    if (val && finishedAt) setStatus("READ");
  };

  const handleFinishedAtChange = (val: string) => {
    setFinishedAt(val);
    if (val) setStatus("READ");
    else if (startedAt) setStatus("READING");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const bookData = {
      title,
      author,
      photoUrl: photoUrl || null,
      summary: summary || null,
      personalReview: personalReview || null,
      rating: rating || null,
      status,
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
      ownershipStatus,
      isOwned: ownershipStatus === "OWNED",
      startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
      readingHours: readingHours ? parseFloat(readingHours) : null,
      isFavorite,
    };

    try {
      const url = bookToEdit ? `/api/books/${bookToEdit.id}` : "/api/books";
      const method = bookToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving book:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bookToEdit || !confirm("¿Estás seguro de que quieres eliminar este libro?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookToEdit.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting book:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (s: string) => {
    switch(s) {
      case 'READ': return 'Leído';
      case 'READING': return 'Leyendo';
      case 'WANT_TO_READ': return 'Quiero leer';
      default: return s;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass animate-fade-in`}>
        <div className={styles.header}>
          <h2>{mode === 'view' ? "Detalles del Libro" : bookToEdit ? "Editar Libro" : "Añadir Nuevo Libro"}</h2>
          <div className={styles.headerActions}>
            {mode === 'view' && (
              <button onClick={() => setMode('edit')} className={styles.editBtn} title="Editar" type="button">
                ✏️
              </button>
            )}
            <button onClick={onClose} className={styles.closeBtn} title="Cerrar" type="button">×</button>
          </div>
        </div>

        {mode === 'view' && bookToEdit ? (
          <div className={styles.viewMode}>
            <div className={styles.viewHeader}>
              <div className={styles.viewCover}>
                {bookToEdit.photoUrl ? (
                  <img src={bookToEdit.photoUrl} alt={bookToEdit.title} />
                ) : (
                  <div className={styles.viewPlaceholder}>Sin portada</div>
                )}
              </div>
              <div className={styles.viewInfo}>
                <h1 className={styles.viewTitle}>
                  {bookToEdit.title} 
                  {bookToEdit.isFavorite && bookToEdit.status === "READ" && (
                    <span className={styles.favStar} title="¡Libro favorito!">🌟</span>
                  )}
                </h1>
                <p className={styles.viewAuthor}>por {bookToEdit.author}</p>
                <div className={styles.viewBadges}>
                  <span className={`${styles.viewBadge} ${styles[bookToEdit.status.toLowerCase()]}`}>
                    {getStatusLabel(bookToEdit.status)}
                  </span>
                  {bookToEdit.ownershipStatus === "OWNED" && <span className={`${styles.viewBadge} ${styles.ownedBadge}`}>🏠 Comprado</span>}
                  {bookToEdit.ownershipStatus === "WISHLIST" && <span className={`${styles.viewBadge} ${styles.wishlistBadge}`}>✨ Deseado</span>}
                  {bookToEdit.ownershipStatus === "NONE" && <span className={`${styles.viewBadge} ${styles.noneBadge}`}>🚫 No comprar</span>}
                </div>
                {bookToEdit.status === 'READ' && bookToEdit.rating && (
                  <div className={styles.viewRating}>
                    <StarRating rating={bookToEdit.rating} onChange={() => {}} editable={false} />
                  </div>
                )}
              </div>
            </div>

            {(bookToEdit.purchaseDate || bookToEdit.startedAt || bookToEdit.finishedAt || bookToEdit.readingHours) && (
              <div className={styles.viewDetailsGrid}>
                {bookToEdit.purchaseDate && (
                  <div className={styles.detailItem}>
                    <small>Comprado el</small>
                    <p>{new Date(bookToEdit.purchaseDate).toLocaleDateString()}</p>
                  </div>
                )}
                {bookToEdit.startedAt && (
                  <div className={styles.detailItem}>
                    <small>Empezado el</small>
                    <p>{new Date(bookToEdit.startedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {bookToEdit.finishedAt && (
                  <div className={styles.detailItem}>
                    <small>Finalizado el</small>
                    <p>{new Date(bookToEdit.finishedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {bookToEdit.readingHours && (
                  <div className={styles.detailItem}>
                    <small>Tiempo total</small>
                    <p>{bookToEdit.readingHours} horas</p>
                  </div>
                )}
              </div>
            )}

            {bookToEdit.summary && (
              <div className={styles.viewSection}>
                <h3>Resumen</h3>
                <p>{bookToEdit.summary}</p>
              </div>
            )}

            {bookToEdit.personalReview && (
              <div className={styles.viewSection}>
                <h3>Tu Opinión</h3>
                <p>{bookToEdit.personalReview}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {!bookToEdit && (
              <div className={styles.searchSection}>
                <div className={styles.inputGroup}>
                  <label>🔍 Buscar en la base de datos</label>
                  <div className={styles.searchBox}>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Escribe título o autor para buscar..."
                      onKeyDown={(e) => e.key === 'Enter' && !isSearching && searchBooks(searchQuery)}
                    />
                    <button type="button" onClick={() => searchBooks(searchQuery)} disabled={isSearching}>
                      {isSearching ? "..." : "Buscar"}
                    </button>
                  </div>
                </div>
                {searchError && (
                  <p className={styles.noResults}>
                    ❌ {searchError}
                  </p>
                )}
                {searchQuery.length > 2 && !isSearching && !searchError && searchResults.length === 0 && (
                  <p className={styles.noResults}>
                    No hay resultados. ¡Inténtalo con otros términos o insértalo manualmente abajo!
                  </p>
                )}
                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((item) => (
                      <div key={item.id} className={styles.searchItem} onClick={() => handleSelectBook(item)}>
                        <img src={item.volumeInfo.imageLinks?.smallThumbnail} alt="" />
                        <div>
                          <p className={styles.searchTitle}>{item.volumeInfo.title}</p>
                          <p className={styles.searchAuthor}>{item.volumeInfo.authors?.[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
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
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>URL de la Foto</label>
                  <input 
                    type="text" 
                    value={photoUrl} 
                    onChange={(e) => setPhotoUrl(e.target.value)} 
                    placeholder="https://... o ruta local"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Imagen Local</label>
                  <div className={styles.fileUpload}>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,.jpg,.jpeg,.png" 
                      onChange={handleFileUpload} 
                      id="file-upload"
                      className={styles.fileInput}
                    />
                    <label htmlFor="file-upload" className={styles.fileLabel}>
                      {uploading ? "Subiendo..." : "📁 Subir portada"}
                    </label>
                  </div>
                </div>
              </div>


              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Estado de Lectura</label>
                  <button 
                    type="button"
                    className={`${styles.statusCycleBtn} ${styles[status.toLowerCase()]}`}
                    onClick={() => {
                      if (status === "WANT_TO_READ") setStatus("READING");
                      else if (status === "READING") setStatus("READ");
                      else setStatus("WANT_TO_READ");
                    }}
                  >
                    {status === "READ" ? "✅ Leído" : status === "READING" ? "📖 Leyendo" : "⏳ Pendiente"}
                  </button>
                </div>
                <div className={styles.inputGroup}>
                  <label>¿Lo tienes?</label>
                  <button 
                    type="button"
                    className={`${styles.statusCycleBtn} ${
                      ownershipStatus === "OWNED" ? styles.owned : 
                      ownershipStatus === "WISHLIST" ? styles.wishlist : 
                      styles.none
                    }`}
                    onClick={() => {
                      if (ownershipStatus === "NONE") setOwnershipStatus("WISHLIST");
                      else if (ownershipStatus === "WISHLIST") setOwnershipStatus("OWNED");
                      else setOwnershipStatus("NONE");
                    }}
                  >
                    {ownershipStatus === "OWNED" ? "🏠 Comprado" : 
                     ownershipStatus === "WISHLIST" ? "✨ Deseado" : 
                     "🚫 No comprar"}
                  </button>
                </div>
              </div>

              {status === "READ" && (
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Valoración y Favorito</label>
                    <div className={styles.ratingFavRow}>
                      <StarRating rating={rating || 0} onChange={setRating} />
                      <button 
                        type="button" 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`${styles.favToggleBtn} ${isFavorite ? styles.favActive : ""}`}
                        title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                      >
                        {isFavorite ? "🌟 Favorito" : "⭐ Marcar favorito"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.section}>
                <h3>Seguimiento (Opcional)</h3>
                <div className={styles.dateToggles}>
                  <div className={styles.inputGroup}>
                    <label>Compra</label>
                    {purchaseDate ? (
                      <div className={styles.dateInputWrapper}>
                        <input type="date" value={purchaseDate} onChange={(e) => handlePurchaseDateChange(e.target.value)} />
                        <button type="button" onClick={() => setPurchaseDate("")} className={styles.clearDate}>×</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setPurchaseDate(new Date().toISOString().split('T')[0])} className={styles.addDateBtn}>
                        + Añadir fecha
                      </button>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Inicio Lectura</label>
                    {startedAt ? (
                      <div className={styles.dateInputWrapper}>
                        <input type="date" value={startedAt} onChange={(e) => handleStartedAtChange(e.target.value)} />
                        <button type="button" onClick={() => setStartedAt("")} className={styles.clearDate}>×</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setStartedAt(new Date().toISOString().split('T')[0])} className={styles.addDateBtn}>
                        + Añadir fecha
                      </button>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Fin Lectura</label>
                    {finishedAt ? (
                      <div className={styles.dateInputWrapper}>
                        <input type="date" value={finishedAt} onChange={(e) => handleFinishedAtChange(e.target.value)} />
                        <button type="button" onClick={() => setFinishedAt("")} className={styles.clearDate}>×</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setFinishedAt(new Date().toISOString().split('T')[0])} className={styles.addDateBtn}>
                        + Añadir fecha
                      </button>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Horas Invertidas</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={readingHours} 
                      onChange={(e) => setReadingHours(e.target.value)} 
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Resumen</label>
                <textarea 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)} 
                  placeholder="¿De qué trata este libro?"
                  rows={2}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Tu Opinión Personal</label>
                <textarea 
                  value={personalReview} 
                  onChange={(e) => setPersonalReview(e.target.value)} 
                  placeholder="¿Qué te ha parecido el libro?"
                  rows={2}
                />
              </div>

              <div className={styles.actions}>
                {bookToEdit && (
                  <button type="button" onClick={handleDelete} className={styles.deleteBtn} disabled={loading}>
                    Eliminar
                  </button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Guardando..." : bookToEdit ? "Actualizar" : "Guardar Libro"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
