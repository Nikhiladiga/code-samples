export interface Book {
  id: string;
  title: string;
  authors: string[];
  publication_year: number;
  average_rating: number;
  image_url: string;
  ratings_count: number;
}
