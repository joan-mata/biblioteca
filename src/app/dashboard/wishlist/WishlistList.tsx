"use client";

import { useState } from "react";
import { Book } from "@/types";
import styles from "./wishlist.module.css";
import { useRouter } from "next/navigation";

export default function WishlistList({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const moveBook = async (index: number, direction: 'up' | 'down') => {
    const newBooks = [...books];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= books.length) return;

    // Swap
    const temp = newBooks[index];
    newBooks[index] = newBooks[newIndex];
    newBooks[newIndex] = temp;

    setBooks(newBooks);
    
    // Save order
    await saveOrder(newBooks);
  };

  const moveToExtreme = async (index: number, extreme: 'top' | 'bottom') => {
    const newBooks = [...books];
    const item = newBooks.splice(index, 1)[0];
    
    if (extreme === 'top') {
      newBooks.unshift(item);
    } else {
      newBooks.push(item);
    }

    setBooks(newBooks);
    await saveOrder(newBooks);
  };

  const saveOrder = async (sortedBooks: Book[]) => {
    setSaving(true);
    try {
      // Update each book with its new index
      const updates = sortedBooks.map((book, idx) => {
        return fetch(`/api/books/${book.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wishlistOrder: idx }),
        });
      });

      await Promise.all(updates);
      router.refresh();
    } catch (error) {
      console.error("Error saving wishlist order:", error);
    } finally {
      setSaving(false);
    }
  };

  if (books.length === 0) {
    return (
      <div className={`${styles.empty} glass`}>
        <p>No tienes libros en tu lista de deseos.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {saving && <div className={styles.savingOverlay}>Guardando orden...</div>}
      {books.map((book, index) => (
        <div key={book.id} className={`${styles.item} glass animate-fade-in`} style={{ animationDelay: `${index * 0.05}s` }}>
          <div className={styles.rank}>{index + 1}</div>
          <div className={styles.coverMini}>
            {book.photoUrl ? (
              <img src={book.photoUrl} alt="" />
            ) : (
              <div className={styles.placeholderMini}>?</div>
            )}
          </div>
          <div className={styles.info}>
            <h4>{book.title}</h4>
            <p>{book.author}</p>
          </div>
          <div className={styles.actions}>
            <button 
              onClick={() => moveBook(index, 'up')} 
              disabled={index === 0 || saving}
              className={styles.actionBtn}
              title="Subir uno"
            >
              ↑
            </button>
            <button 
              onClick={() => moveBook(index, 'down')} 
              disabled={index === books.length - 1 || saving}
              className={styles.actionBtn}
              title="Bajar uno"
            >
              ↓
            </button>
            <button 
              onClick={() => moveToExtreme(index, 'top')} 
              disabled={index === 0 || saving}
              className={`${styles.actionBtn} ${styles.extremeBtn}`}
              title="Mover al principio"
            >
              ↑↑
            </button>
            <button 
              onClick={() => moveToExtreme(index, 'bottom')} 
              disabled={index === books.length - 1 || saving}
              className={`${styles.actionBtn} ${styles.extremeBtn}`}
              title="Mover al final"
            >
              ↓↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
