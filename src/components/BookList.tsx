"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import AddBookModal from "./AddBookModal";
import { Book } from "@/types";
import styles from "./BookList.module.css";

export default function BookList({ initialBooks }: { initialBooks: Book[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ownedFilter, setOwnedFilter] = useState<"ALL" | "OWNED" | "WISHLIST" | "NONE">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"title" | "date">("title");
 
  const filteredBooks = initialBooks
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                            book.author.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || book.status === statusFilter;
      const matchesOwned = ownedFilter === "ALL" || book.ownershipStatus === ownedFilter;
      
      return matchesSearch && matchesStatus && matchesOwned;
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return dateB - dateA; // Newest first
      }
    });

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBook(undefined);
    setIsModalOpen(false);
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'READ': return 'Leído';
      case 'READING': return 'Leyendo';
      case 'WANT_TO_READ': return 'Quiero leer';
      case 'OWNED': return 'En estantería';
      default: return status;
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Buscar por título o autor..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass"
            />
          </div>
          <div className={styles.controls}>
            <div className={styles.viewToggle}>
              <button 
                onClick={() => setView("grid")} 
                className={view === "grid" ? styles.active : ""}
              >
                田
              </button>
              <button 
                onClick={() => setView("list")} 
                className={view === "list" ? styles.active : ""}
              >
                ☰
              </button>
            </div>
            <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>+ Añadir</button>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>🔍 Filtrar:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass"
            >
              <option value="ALL">Cualquier estado</option>
              <option value="READ">Leídos ✓</option>
              <option value="READING">Leyendo 📖</option>
              <option value="WANT_TO_READ">Quiero leer ⏳</option>
            </select>

            <select 
              value={ownedFilter} 
              onChange={(e) => setOwnedFilter(e.target.value as any)}
              className="glass"
            >
              <option value="ALL">Toda la colección</option>
              <option value="OWNED">En estantería 🏠</option>
              <option value="WISHLIST">Lista de deseos ✨</option>
              <option value="NONE">No comprar 🚫</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>↕️ Ordenar:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass"
            >
              <option value="title">Título (A-Z)</option>
              <option value="date">Más recientes</option>
            </select>
          </div>
        </div>
      </header>

      {isModalOpen && <AddBookModal onClose={handleCloseModal} bookToEdit={selectedBook} />}

      <div className={view === "grid" ? styles.grid : styles.list}>
        {filteredBooks.map((book) => (
          <div 
            key={book.id} 
            className={`${styles.bookCard} glass animate-fade-in`}
            onClick={() => handleEditBook(book)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.cardBadges}>
              {book.ownershipStatus === 'OWNED' && <span className={`${styles.badge} ${styles.ownedBadge}`} title="Comprado">🏠</span>}
              {book.ownershipStatus === 'WISHLIST' && <span className={`${styles.badge} ${styles.wishlistBadge}`} title="Deseado">✨</span>}
              {book.ownershipStatus === 'NONE' && <span className={`${styles.badge} ${styles.noneBadge}`} title="No comprar">🚫</span>}
              <span className={`${styles.badge} ${styles.statusBadge} ${styles[book.status.toLowerCase()]}`}>
                {book.status === 'READ' ? '✓' : book.status === 'READING' ? '📖' : '⏳'}
              </span>
            </div>

            {(view === "grid" || book.photoUrl) && (
              <div className={styles.coverWrapper}>
                {book.photoUrl ? (
                  <img src={book.photoUrl} alt={book.title} className={styles.cover} />
                ) : (
                  <div className={styles.placeholderCover}>
                    <h3 className={styles.placeholderTitle}>{book.title}</h3>
                    <p className={styles.placeholderAuthor}>{book.author}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.bookDetails}>
              <div className={styles.bookHeaderRow}>
                <div className={styles.titleAuthor}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                </div>
                {book.status === 'READ' && book.rating !== null && (
                  <div className={styles.rating}>
                    <StarRating rating={book.rating} onChange={() => {}} editable={false} />
                  </div>
                )}
              </div>
              
              {view === "list" && book.summary && (
                <p className={styles.summary}>{book.summary.substring(0, 150)}...</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className={styles.empty}>
          <p>No se encontraron libros. ¡Empieza a añadir algunos!</p>
        </div>
      )}
    </div>
  );
}
