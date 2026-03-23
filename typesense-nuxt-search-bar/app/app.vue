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
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
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
