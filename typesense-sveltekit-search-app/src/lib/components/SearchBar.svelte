<script lang="ts">
  import type { SearchService } from '../searchService.svelte';

  interface Props {
    searchService: SearchService;
  }

  let { searchService }: Props = $props();

  let inputValue = $state('');

  $effect(() => {
    inputValue = searchService.query;
  });

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    inputValue = val;
    searchService.refine(val);
  }

  function handleReset() {
    inputValue = '';
    searchService.refine('');
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    searchService.refine(inputValue);
  }
</script>

<div class="searchContainer">
  <form class="searchForm" onsubmit={handleSubmit}>
    <input
      type="search"
      placeholder="Search for books by title or author..."
      class="searchInput"
      value={inputValue}
      oninput={handleInput}
    />
    
    <button type="submit" class="searchButton" aria-label="Search">
      {#if searchService.loading}
        <div class="loadingSpinner"></div>
      {:else}
        <svg
          class="searchIcon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      {/if}
    </button>

    {#if inputValue}
      <button type="button" class="resetButton" onclick={handleReset} aria-label="Clear search">
        <svg
          class="closeIcon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    {/if}
  </form>
</div>

<style>
.searchContainer {
  max-width: 48rem;
  margin: 0 auto 2rem;
}

.searchForm {
  position: relative;
}

.searchInput {
  width: 100%;
  padding: 1rem 3rem;
  border-radius: 0.5rem;
  border: 2px solid #e5e7eb;
  font-size: 1rem;
  box-sizing: border-box;
}

.searchInput:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.searchInput::-webkit-search-decoration,
.searchInput::-webkit-search-cancel-button,
.searchInput::-webkit-search-results-button,
.searchInput::-webkit-search-results-decoration {
  display: none;
}

.searchButton,
.resetButton {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.searchButton {
  left: 0.75rem;
}

.resetButton {
  right: 0.75rem;
}

.resetButton:hover {
  color: #4b5563;
}

.loadingSpinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #4f46e5;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.searchIcon,
.closeIcon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
</style>
