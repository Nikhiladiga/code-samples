import React from "react";
import { Document } from "../types/Book";
import { BookCard } from "./BookCard";

export const BookList = ({ books }: { books: Document[] }) => {
  return (
    <>
      {books.map((book) => (
        <BookCard key={book.document.id} book={book.document} />
      ))}
    </>
  );
};
