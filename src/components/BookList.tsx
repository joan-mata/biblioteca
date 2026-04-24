"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import AddBookModal from "./AddBookModal";
import { Book } from "@/types";
import styles from "./BookList.module.css";

type SortField = "title" | "author" | "purchaseDate" | "finishedAt";
type SortDir = "asc" | "desc";

export default function BookList({ initialBooks }: { initialBooks: Book[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ownedFilter, setOwnedFilter] = useState<"ALL" | "OWNED" | "WISHLIST" | "NONE">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSortField = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field clicked
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Dates default to desc (newest first), text fields default to asc
      setSortDir(field === "purchaseDate" || field === "finishedAt" ? "desc" : "asc");
    }
  };

  const normalizeText = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredBooks = initialBooks
    .filter((book) => {
      const q = normalizeText(search);
      const matchesSearch =
        normalizeText(book.title).includes(q) ||
        normalizeText(book.author).includes(q);
      const matchesStatus = statusFilter === "ALL" || book.status === statusFilter;
      const matchesOwned = ownedFilter === "ALL" || book.ownershipStatus === ownedFilter;
      return matchesSearch && matchesStatus && matchesOwned;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") {
        cmp = a.title.localeCompare(b.title, "es", { sensitivity: "base" });
      } else if (sortField === "author") {
        cmp = a.author.localeCompare(b.author, "es", { sensitivity: "base" });
      } else if (sortField === "purchaseDate") {
        const da = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const db = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        cmp = da - db;
      } else if (sortField === "finishedAt") {
        const da = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const db = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        cmp = da - db;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBook(undefined);
    setIsModalOpen(false);
  };

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "title",       label: "Título" },
    { value: "author",      label: "Autor" },
    { value: "purchaseDate",label: "Fecha de compra" },
    { value: "finishedAt",  label: "Fecha de lectura" },
  ];

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
            <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
              + Añadir
            </button>
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
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortField(opt.value)}
                className={`${styles.sortBtn} ${sortField === opt.value ? styles.sortActive : ""}`}
              >
                {opt.label}
                {sortField === opt.value && (
                  <span className={styles.sortArrow}>
                    {sortDir === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </button>
            ))}
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
            style={{ cursor: "pointer" }}
          >
            <div className={styles.cardBadges}>
              {book.isFavorite && (
                <span className={`${styles.badge} ${styles.favoriteBadge}`} title="¡Libro favorito!">🌟</span>
              )}
              {book.ownershipStatus === "OWNED" && (
                <span className={`${styles.badge} ${styles.ownedBadge}`} title="Comprado">🏠</span>
              )}
              {book.ownershipStatus === "WISHLIST" && (
                <span className={`${styles.badge} ${styles.wishlistBadge}`} title="Deseado">✨</span>
              )}
              {book.ownershipStatus === "NONE" && (
                <span className={`${styles.badge} ${styles.noneBadge}`} title="No comprar">🚫</span>
              )}
              <span className={`${styles.badge} ${styles.statusBadge} ${styles[book.status.toLowerCase()]}`}>
                {book.status === "READ" ? "✓" : book.status === "READING" ? "📖" : "⏳"}
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
              </div>
              
              {book.status === "READ" && book.rating !== null && (
                <div className={styles.rating}>
                  <StarRating rating={book.rating} onChange={() => {}} editable={false} />
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
