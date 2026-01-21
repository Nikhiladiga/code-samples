import './style.css';
import { typesenseInstantsearchAdapter } from './typesense.js';
import instantsearch from 'instantsearch.js';
import { searchBox, hits, stats, configure } from 'instantsearch.js/es/widgets';

const search = instantsearch({
  indexName: 'books',
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
    container: '#searchbox',
    placeholder: 'Search by title or author...',
    showReset: true,
    showSubmit: true,
    cssClasses: {
      form: 'search-form',
      input: 'search-input',
      submit: 'search-submit',
      reset: 'search-reset',
    },
  }),
  stats({
    container: '#stats',
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
    container: '#hits',
    templates: {
      item(hit, { html, components }) {
        const stars = '★'.repeat(Math.round(hit.average_rating || 0));
        return html`
          <div class="book-card">
            ${hit.image_url ? html`
              <div class="book-image-container">
                <img 
                  src="${hit.image_url}" 
                  alt="Cover of ${hit.title}" 
                  class="book-image"
                />
              </div>
            ` : ''}
            <div class="book-info">
              <h3 class="book-title">${components.Highlight({ attribute: 'title', hit })}</h3>
              <p class="book-author">${hit.authors?.join(', ') || 'Unknown Author'}</p>
              <div class="rating-container">
                <span class="star-rating">${stars}</span>
                <span class="rating-text">
                  ${hit.average_rating?.toFixed(1) || '0'} (${hit.ratings_count?.toLocaleString() || 0} ratings)
                </span>
              </div>
              ${hit.publication_year ? html`<p class="book-year">Published: ${hit.publication_year}</p>` : ''}
            </div>
          </div>
        `;
      },
      empty(results, { html }) {
        return html`
          <div class="no-results">
            <h3>No books found</h3>
            <p>Try adjusting your search or try different keywords.</p>
          </div>
        `;
      },
    },
  }),
]);

search.start();
