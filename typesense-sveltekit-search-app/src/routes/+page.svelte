<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SearchService } from '$lib/searchService.svelte';
  import Heading from '$lib/components/Heading.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import BookList from '$lib/components/BookList.svelte';

  const searchService = new SearchService();

  onMount(() => {
    searchService.start();
  });

  onDestroy(() => {
    searchService.destroy();
  });
</script>

<svelte:head>
  <title>SvelteKit Search Bar</title>
  <meta
    name="description"
    content="Search through our collection of books"
  />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4">
  <div class="max-w-7xl mx-auto">
    <Heading />
    <SearchBar {searchService} />
    <BookList {searchService} />
  </div>
</div>
