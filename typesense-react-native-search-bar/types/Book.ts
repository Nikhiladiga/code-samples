export interface Book {
  id: string;
  title: string;
  authors: string[];
  image_url: string;
  publication_year: number;
}

export interface Document {
  document: Book;
}
