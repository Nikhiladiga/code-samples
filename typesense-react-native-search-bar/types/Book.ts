export interface Book {
  id: string;
  title: string;
  authors: string[];
  image_url: string;
  publication_year: number;
  average_rating?: number;
  ratings_count?: number;
}
