<script setup lang="ts">
import { AisHits } from "vue-instantsearch/vue3/es";
import type { Book } from "../types/Book";
import BookCard from "./BookCard.vue";
</script>

<template>
  <ais-hits>
    <template #default="{ items }">
      <div v-if="items.length === 0" class="empty-state">
        No books found. Try a different search term.
      </div>
      <div v-else class="book-list">
        <BookCard
          v-for="item in items"
          :key="item.objectID"
          :book="item as Book"
        />
      </div>
    </template>
  </ais-hits>
</template>

<style scoped>
.book-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem 0;
}

@media (min-width: 768px) {
  .book-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .book-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #6b7280;
}
</style>
