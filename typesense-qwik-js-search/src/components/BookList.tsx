import { component$ } from "@builder.io/qwik";
import type { Book } from "../types/Book";
import { BookCard } from "./BookCard";

interface BookListProps {
  books: Book[];
  isSearching: boolean;
}

export const BookList = component$<BookListProps>(({ books, isSearching }) => {
  if (!books || books.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500">
        {isSearching
          ? "No books found. Try a different search term."
          : "Start typing to search for books."}
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
});
