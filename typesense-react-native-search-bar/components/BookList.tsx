import React from "react";
import { useHits } from "react-instantsearch-core";
import { BookCard } from "./BookCard";
import { Book } from "../types/Book";

export const BookList = () => {
  const { items } = useHits<Book>();

  return (
    <>
      {items.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </>
  );
};
