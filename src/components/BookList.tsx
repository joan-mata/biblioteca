"use client";

import { useState } from "react";
import styles from "./BookList.module.css";
import AddBookModal from "./AddBookModal";

interface Book {
  id: string;
  title: string;
  author: string;
  photoUrl: string | null;
  rating: number | null;
  status: string;
  summary: string | null;
  personalReview: string | null;
}

export default function BookList({ initialBooks }: { initialBooks: Book[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBooks = initialBooks.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
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
              田 Cuadrícula
            </button>
            <button 
              onClick={() => setView("list")} 
              className={view === "list" ? styles.active : ""}
            >
              ☰ Lista
            </button>
          </div>
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>+ Añadir Libro</button>
        </div>
      </header>

      {isModalOpen && <AddBookModal onClose={() => setIsModalOpen(false)} />}

      <div className={view === "grid" ? styles.grid : styles.list}>
        {filteredBooks.map((book) => (
          <div key={book.id} className={`${styles.bookCard} glass animate-fade-in`}>
            <div className={styles.coverWrapper}>
              {book.photoUrl ? (
                <img src={book.photoUrl} alt={book.title} className={styles.cover} />
              ) : (
                <div className={styles.placeholderCover}>
                  <h3 className={styles.placeholderTitle}>{book.title}</h3>
                  <p className={styles.placeholderAuthor}>{book.author}</p>
                </div>
              )}
              <span className={`${styles.statusBadge} ${styles[book.status.toLowerCase()]}`}>
                {book.status === "READ" ? "Leído" : book.status === "TO_READ" ? "Quiero leer" : "En estantería"}
              </span>
            </div>
            
            <div className={styles.bookDetails}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author}</p>
              {book.rating && (
                <div className={styles.rating}>
                  {"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}
                </div>
              )}
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
