<script lang="ts">
  import type { Book } from '../types';

  interface Props {
    book: Book;
  }

  let { book }: Props = $props();

  let imageError = $state(false);
</script>

<div class="bookCard">
  <div class="bookImageContainer">
    {#if book.image_url && !imageError}
      <img
        src={book.image_url}
        alt={book.title}
        class="bookImage"
        onerror={() => imageError = true}
      />
    {:else}
      <div class="noImage">
        <svg class="placeholderIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <span>No Cover</span>
      </div>
    {/if}
  </div>
  <div class="bookInfo">
    <h3 class="bookTitle">{book.title}</h3>
    <p class="bookAuthor">By: {book.authors?.join(", ") || 'Unknown Author'}</p>
    {#if book.publication_year}
      <p class="bookYear">Published: {book.publication_year}</p>
    {/if}
    <div class="ratingContainer">
      <div class="starRating">
        {"★".repeat(Math.round(book.average_rating || 0))}
        {"☆".repeat(5 - Math.round(book.average_rating || 0))}
      </div>
      <span class="ratingText">
        {book.average_rating?.toFixed(1) || '0.0'}
      </span>
    </div>
  </div>
</div>

<style>
.bookCard {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 200ms ease-in-out;
}

.bookCard:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.bookImageContainer {
  flex-shrink: 0;
  width: 8rem;
  height: 12rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  overflow: hidden;
}

.bookImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.noImage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
}

.placeholderIcon {
  width: 2rem;
  height: 2rem;
  stroke: #9ca3af;
}

.bookInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bookTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bookAuthor {
  color: #4b5563;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.bookYear {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.ratingContainer {
  margin-top: auto;
  padding-top: 0.5rem;
  display: flex;
  align-items: center;
}

.starRating {
  color: #f59e0b;
  font-size: 1.125rem;
  line-height: 1;
}

.ratingText {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;
}
</style>
