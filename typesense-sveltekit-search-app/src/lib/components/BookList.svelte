<script lang="ts">
	import type { SearchService } from '../searchService.svelte';
  import BookCard from './BookCard.svelte';

  interface Props {
    searchService: Pick<SearchService, 'hits' | 'loading' | 'hasSearched' | 'nbHits'>;
  }

	let { searchService }: Props = $props();

	function resultsText(nbHits: number) {
		if (nbHits > 1) return `${nbHits.toLocaleString()} results found`;
		if (nbHits === 1) return '1 result found';
		return 'No results found';
	}
</script>

{#if searchService.hasSearched}
	<div class="resultsCount">{resultsText(searchService.nbHits)}</div>
{/if}

{#if searchService.loading}
	<div class="loadingContainer">
		<div class="spinner"></div>
		<p>Searching...</p>
	</div>
{:else if !searchService.hasSearched}
	<div class="emptyState">Loading search client...</div>
{:else if searchService.hits.length === 0}
	<div class="emptyState">
		<h3>No books found</h3>
		<p>Try adjusting your search or try different keywords.</p>
	</div>
{:else}
	<div class="bookList">
		{#each searchService.hits as book (book.objectID || book.id)}
			<BookCard {book} />
		{/each}
	</div>
{/if}

<style>
	.bookList {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		padding: 1.5rem 0;
	}

	@media (min-width: 768px) {
		.bookList {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.bookList {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.emptyState {
		text-align: center;
		padding: 3rem 0;
		color: #6b7280;
	}

	.resultsCount {
		margin-bottom: 1rem;
		text-align: center;
		color: #4b5563;
	}

	.loadingContainer {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem 0;
		color: #6b7280;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
