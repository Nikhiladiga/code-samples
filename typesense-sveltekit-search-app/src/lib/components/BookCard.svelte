<script lang="ts">
	import type { Book } from '../types';

	interface Props {
		book: Book;
	}

	let { book }: Props = $props();
</script>

<div class="bookCard">
  {#if book.image_url}
    <div class="bookImageContainer">
      <img src={book.image_url} alt={`Cover of ${book.title}`} class="bookImage" />
    </div>
  {/if}
	<div class="bookInfo">
		<h3 class="bookTitle">{book.title}</h3>
		<p class="bookAuthor">{book.authors?.join(', ') || 'Unknown Author'}</p>
		<div class="ratingContainer">
			<span class="starRating">
				{'★'.repeat(Math.round(book.average_rating || 0))}
			</span>
			<span class="ratingText">
				{book.average_rating?.toFixed(1) || '0'} ({book.ratings_count?.toLocaleString() || 0} ratings)
			</span>
		</div>
		{#if book.publication_year}
			<p class="bookYear">Published: {book.publication_year}</p>
		{/if}
	</div>
</div>

<style>
	.bookCard {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		background-color: white;
		border-radius: 0.5rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: box-shadow 200ms ease-in-out;
	}

	.bookCard:hover {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
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
