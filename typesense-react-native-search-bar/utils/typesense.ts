import { Document } from "../types/Book";

export const search = async (searchQuery: string): Promise<Document[]> => {
  const url = `${process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL}://${process.env.EXPO_PUBLIC_TYPESENSE_HOST}:${process.env.EXPO_PUBLIC_TYPESENSE_PORT}/collections/books/documents/search?q=${encodeURIComponent(
    searchQuery,
  )}&query_by=title,authors`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-TYPESENSE-API-KEY": process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || "xyz",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Typesense search failed");
  }

  const data = await response.json();
  return data?.hits || [];
};
