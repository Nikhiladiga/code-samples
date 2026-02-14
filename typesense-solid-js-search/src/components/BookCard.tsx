import styles from "./BookCard.module.css";
import type { Book } from "../types/Book";

interface BookCardProps {
  book: Book;
}

export function BookCard(props: BookCardProps) {
  const stars = "★".repeat(Math.round(props.book.average_rating || 0));

  return (
    <div class={styles.bookCard}>
      {props.book.image_url && (
        <div class={styles.bookImageContainer}>
          <img
            src={props.book.image_url}
            alt={`Cover of ${props.book.title}`}
            class={styles.bookImage}
          />
        </div>
      )}
      <div class={styles.bookInfo}>
        <h3 class={styles.bookTitle}>{props.book.title}</h3>
        <p class={styles.bookAuthor}>
          {props.book.authors?.join(", ") || "Unknown Author"}
        </p>
        <div class={styles.ratingContainer}>
          <span class={styles.starRating}>{stars}</span>
          <span class={styles.ratingText}>
            {props.book.average_rating?.toFixed(1) || "0"} (
            {props.book.ratings_count?.toLocaleString() || 0} ratings)
          </span>
        </div>
        {props.book.publication_year && (
          <p class={styles.bookYear}>
            Published: {props.book.publication_year}
          </p>
        )}
      </div>
    </div>
  );
}
