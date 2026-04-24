"use client";

import { useState } from "react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  editable?: boolean;
}

export default function StarRating({ rating, onChange, editable = true }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${star <= (hover || rating) ? styles.filled : ""}`}
          onClick={() => editable && onChange(star)}
          onMouseEnter={() => editable && setHover(star)}
          onMouseLeave={() => editable && setHover(0)}
          disabled={!editable}
        >
          ★
        </button>
      ))}
    </div>
  );
}
