import { For, Show } from "solid-js";
import { BookCard } from "./BookCard";
import styles from "./BookList.module.css";
import type { Book } from "../types/Book";

interface BookListProps {
  books: Book[];
  loading: boolean;
}

export function BookList(props: BookListProps) {
  return (
    <div class={styles.bookList}>
      <Show when={props.loading}>
        <div class={styles.loadingContainer}>
          <div class={styles.spinner}></div>
          <p>Searching...</p>
        </div>
      </Show>

      <Show when={!props.loading && props.books.length === 0}>
        <div class={styles.noResults}>
          <h3>No books found</h3>
          <p>Try adjusting your search or try different keywords.</p>
        </div>
      </Show>

      <Show when={!props.loading && props.books.length > 0}>
        <div class={styles.bookGrid}>
          <For each={props.books}>{(book) => <BookCard book={book} />}</For>
        </div>
      </Show>
    </div>
  );
}
