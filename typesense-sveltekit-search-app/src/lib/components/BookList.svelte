<script lang="ts">
  import type { SearchService } from '../searchService.svelte';
  import BookCard from './BookCard.svelte';

  interface Props {
    searchService: SearchService;
  }

  let { searchService }: Props = $props();
</script>

{#if !searchService.hasSearched}
  <div class="emptyState">
    Loading search client...
  </div>
{:else}
  {#if searchService.hits.length === 0}
    <div class="emptyState">
      {#if searchService.query}
        No books found. Try a different search term.
      {:else}
        Start typing to search for books.
      {/if}
    </div>
  {:else}
    <div class="bookList">
      {#each searchService.hits as book (book.objectID || book.id)}
        <BookCard {book} />
      {/each}
    </div>
  {/if}
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
</style>
