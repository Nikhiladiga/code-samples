<script lang="ts">
  import type { SearchService } from '../searchService.svelte';

  interface Props {
    searchService: Pick<SearchService, 'query' | 'refine'>;
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

	function handleSubmit(e: Event) {
		e.preventDefault();
		searchService.refine(inputValue);
	}
</script>

<div class="searchContainer">
	<form class="searchForm" onsubmit={handleSubmit}>
		<input
			type="search"
			placeholder="Search by title or author..."
			class="searchInput"
			value={inputValue}
			oninput={handleInput}
		/>
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
		padding: 1rem;
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
</style>
