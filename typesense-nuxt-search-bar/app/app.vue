<script setup lang="ts">
import { AisInstantSearch } from "vue-instantsearch/vue3/es";
import { createTypesenseAdapter } from "../utils/instantSearchAdapter";
import Heading from "../components/Heading.vue";
import SearchBar from "../components/SearchBar.vue";
import BookList from "../components/BookList.vue";

const config = useRuntimeConfig();
const typesenseConfig = config.public.typesense;

const typesenseAdapter = createTypesenseAdapter({
  apiKey: typesenseConfig.apiKey,
  host: typesenseConfig.host,
  port: typesenseConfig.port,
  protocol: typesenseConfig.protocol,
});

useHead({
  title: "Nuxt.js Search Bar",
  meta: [
    {
      name: "description",
      content: "Search through our collection of books",
    },
  ],
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/favicon.png",
    },
  ],
});
</script>

<template>
  <div class="app-container">
    <div class="app-content">
      <AisInstantSearch
        :search-client="typesenseAdapter.searchClient"
        :index-name="typesenseConfig.index"
      >
        <Heading />
        <SearchBar />
        <BookList />
      </AisInstantSearch>
    </div>
  </div>
</template>

<style>
* {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 1rem;
}

.app-content {
  max-width: 80rem;
  margin: 0 auto;
}
</style>
