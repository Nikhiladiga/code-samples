import { onMount, onCleanup, createSignal } from "solid-js";
import { typesenseInstantsearchAdapter } from "../utils/typesense";
import instantsearch from "instantsearch.js";
import { searchBox, hits, stats, configure } from "instantsearch.js/es/widgets";
import { BookList } from "./BookList";
import styles from "./BookSearch.module.css";
import type { Book } from "../types/Book";

export function BookSearch() {
  const [books, setBooks] = createSignal<Book[]>([]);
  const [loading, setLoading] = createSignal(false);

  let search: any;

  onMount(() => {
    search = instantsearch({
      indexName: "books",
      searchClient: typesenseInstantsearchAdapter.searchClient,
      future: {
        preserveSharedStateOnUnmount: true,
      },
    });

    search.addWidgets([
      configure({
        hitsPerPage: 12,
      }),
      searchBox({
        container: "#searchbox",
        placeholder: "Search by title or author...",
        showReset: false,
        showSubmit: false,
        cssClasses: {
          form: styles.searchForm,
          input: styles.searchInput,
          submit: styles.searchSubmit,
        },
      }),
      stats({
        container: "#stats",
        templates: {
          text(data, { html }) {
            if (data.hasManyResults) {
              return html`${data.nbHits.toLocaleString()} results found`;
            } else if (data.hasOneResult) {
              return html`1 result found`;
            } else {
              return html`No results found`;
            }
          },
        },
      }),
      hits({
        container: "#hits",
        templates: {
          item: () => {
            return "";
          },
          empty: () => {
            return "";
          },
        },
        transformItems: (items: any[]) => {
          const booksData = items.map((item) => item as Book);
          setBooks(booksData);
          return items;
        },
      }),
    ]);

    // Listen for search state changes
    search.on("render", () => {
      const helper = search.helper;
      setLoading(helper.state.loading);
    });

    search.start();
  });

  onCleanup(() => {
    if (search) {
      search.dispose();
    }
  });

  return (
    <div class={styles.searchContainer}>
      <div class={styles.searchBoxContainer}>
        <div id="searchbox"></div>
      </div>

      <div id="stats" class={styles.resultsCount}></div>

      <div id="hits" style="display: none;"></div>

      <BookList books={books()} loading={loading()} />
    </div>
  );
}
