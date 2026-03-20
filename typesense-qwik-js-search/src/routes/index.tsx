import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Heading from "~/components/Heading";
import { BookList } from "~/components/BookList";
import type { Book } from "~/types/Book";
import instantsearch from "instantsearch.js";
import { searchBox, hits, configure } from "instantsearch.js/es/widgets";
import { searchClient, INDEX_NAME } from "~/utils/typesense";

export default component$(() => {
  const books = useSignal<Book[]>([]);
  const isSearching = useSignal(false);
  const containerRef = useSignal<HTMLElement>();
  const searchInitialized = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup, track }) => {
    track(() => containerRef.value);

    if (!containerRef.value || searchInitialized.value) return;

    try {
      const search = instantsearch({
        indexName: INDEX_NAME,
        searchClient,
        routing: false,
      });

      let isMounted = true;

      search.addWidgets([
        configure({
          hitsPerPage: 50,
        }),
        searchBox({
          container: "#searchbox",
          placeholder: "Search for books by title or author...",
          showSubmit: false,
          showReset: true,
          showLoadingIndicator: true,
        }),
        hits({
          container: "#hits",
          templates: {
            empty: "No books found. Try a different search term.",
            item() {
              return "";
            },
          },
          transformItems(items) {
            if (!isMounted) return items;

            const typedItems = items.map((item: any) => {
              const book: Book = {
                id: String(item.id || item.objectID || Math.random()),
                title: String(item.title || "Untitled"),
                authors: Array.isArray(item.authors) ? item.authors : [],
                publication_year: Number(item.publication_year) || 0,
                average_rating: Number(item.average_rating) || 0,
                image_url: String(item.image_url || ""),
                ratings_count: Number(item.ratings_count) || 0,
              };
              return book;
            });

            books.value = typedItems;
            isSearching.value = true;
            return items;
          },
        }),
      ]);

      search.start();
      searchInitialized.value = true;

      cleanup(() => {
        isMounted = false;
        search.dispose();
        searchInitialized.value = false;
      });
    } catch (error) {
      console.error("Failed to initialize InstantSearch:", error);
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 py-8 px-4" ref={containerRef}>
      <div class="max-w-7xl mx-auto">
        <Heading />
        <div class="max-w-3xl mx-auto mb-8">
          <div id="searchbox"></div>
        </div>
        <div id="hits" style="display: none;"></div>
        <BookList books={books.value} isSearching={isSearching.value} />
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Qwik Search Bar - Typesense",
  meta: [
    {
      name: "description",
      content: "Search through our collection of books",
    },
  ],
};
