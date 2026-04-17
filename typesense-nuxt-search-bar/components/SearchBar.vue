<script setup lang="ts">
import { AisSearchBox } from "vue-instantsearch/vue3/es";
</script>

<template>
  <div class="search-container">
    <ais-search-box
      placeholder="Search for books by title or author..."
      :class-names="{
        'ais-SearchBox-form': 'search-form',
        'ais-SearchBox-input': 'search-input',
        'ais-SearchBox-submit': 'search-button',
        'ais-SearchBox-reset': 'reset-button',
      }"
    >
      <template #submit-icon>
        <svg
          class="search-icon"
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
      </template>
      <template #reset-icon>
        <svg
          class="close-icon"
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
      </template>
      <template #loading-indicator>
        <div class="loading-spinner" />
      </template>
    </ais-search-box>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 48rem;
  margin: 0 auto 2rem;
}

:deep(.search-form) {
  position: relative;
}

:deep(.search-input) {
  width: 100%;
  padding: 1rem 3rem;
  border-radius: 0.5rem;
  border: 2px solid #e5e7eb;
  font-size: 1rem;
}

:deep(.search-input:focus) {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

:deep(.search-button),
:deep(.reset-button) {
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

:deep(.search-button) {
  left: 0.75rem;
}

:deep(.reset-button) {
  right: 0.75rem;
}

:deep(.reset-button:hover) {
  color: #4b5563;
}

.loading-spinner {
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

.search-icon,
.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
</style>
