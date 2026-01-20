import { useHits } from "react-instantsearch";
import type { Book } from "../types/Book";
import { BookCard } from "./BookCard";
import styles from "./BookList.module.css";

export const BookList = () => {
  const { items } = useHits<Book>();

  if (!items || items.length === 0) {
    return (
      <div className={styles.emptyState}>
        {items
          ? "No books found. Try a different search term."
          : "Start typing to search for books."}
      </div>
    );
  }

  return (
    <div className={styles.bookList}>
      {items.map((item) => (
        <BookCard key={item.objectID} book={item as unknown as Book} />
      ))}
    </div>
  );
};
