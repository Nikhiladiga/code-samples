import { Component, Input } from '@angular/core';
import { Book } from '../../types/book';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;

  get stars(): string {
    return '\u2605'.repeat(Math.round(this.book.average_rating || 0));
  }

  get formattedRating(): string {
    return (this.book.average_rating || 0).toFixed(1);
  }

  get formattedRatingsCount(): string {
    return (this.book.ratings_count || 0).toLocaleString();
  }

  get authorList(): string {
    return this.book.authors?.join(', ') ?? '';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
