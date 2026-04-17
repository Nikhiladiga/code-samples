<script setup lang="ts">
import type { Book } from "../types/Book";
import { ref } from "vue";

const props = defineProps<{
  book: Book;
}>();

const imageError = ref(false);

const handleImageError = () => {
  imageError.value = true;
};
</script>

<template>
  <div class="book-card">
    <div class="book-image-container">
      <img
        v-if="book.image_url && !imageError"
        :src="book.image_url"
        :alt="book.title"
        class="book-image"
        @error="handleImageError"
      />
      <div v-else class="no-image">No Image</div>
    </div>
    <div class="book-info">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-author">By: {{ book.authors.join(", ") }}</p>
      <p class="book-year">Published: {{ book.publication_year }}</p>
      <div class="rating-container">
        <div class="star-rating">
          {{ "★".repeat(Math.round(book.average_rating)) }}
        </div>
        <span class="rating-text">
          {{ book.average_rating.toFixed(1) }} ({{
            book.ratings_count.toLocaleString()
          }}
          ratings)
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-card {
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

.book-card:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.book-image-container {
  flex-shrink: 0;
  width: 8rem;
  height: 12rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  overflow: hidden;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  color: #4b5563;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.book-year {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.rating-container {
  margin-top: auto;
  padding-top: 0.5rem;
  display: flex;
  align-items: center;
}

.star-rating {
  color: #f59e0b;
  font-size: 1.125rem;
  line-height: 1;
}

.rating-text {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;
}
</style>
